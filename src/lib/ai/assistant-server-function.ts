import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assistantTurnInputSchema,
  assistantTurnResponseSchema,
  type AssistantActionResult,
} from "./assistant-contracts";

function errorResult(code: string, message: string): AssistantActionResult {
  return { ok: false, error: { code, message } };
}

function getServiceEndpoint(value: string | undefined): URL | undefined {
  if (!value) return undefined;
  try {
    const url = new URL("/api/chat", value);
    const isLocalHttp =
      url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.protocol !== "https:" && !isLocalHttp) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

export const sendTeacherAssistantTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(assistantTurnInputSchema)
  .handler(async ({ data }): Promise<AssistantActionResult> => {
    const request = getRequest();
    const authorization = request.headers.get("authorization");
    const serviceToken = env.TEACHERHUB_AI_SERVICE_TOKEN;
    const serviceEndpoint = getServiceEndpoint(env.TEACHERHUB_AI_SERVICE_URL);
    if (!authorization || !serviceToken || !serviceEndpoint) {
      return errorResult("configuration_error", "Teacher Desk AI is not configured.");
    }

    let response: Response;
    try {
      response = await fetch(serviceEndpoint, {
        method: "POST",
        headers: {
          authorization,
          "content-type": "application/json",
          "x-teacherhub-ai-service-token": serviceToken,
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(120_000),
      });
    } catch (error) {
      console.error(
        `[teacherhub-ai-proxy] request failed (${error instanceof Error ? error.name : "unknown error"})`,
      );
      return errorResult("assistant_unavailable", "Teacher Desk AI is temporarily unavailable.");
    }

    let rawResponse: unknown;
    try {
      rawResponse = await response.json();
    } catch {
      return errorResult(
        "invalid_service_response",
        "Teacher Desk AI returned an invalid response.",
      );
    }

    const parsedResponse = assistantTurnResponseSchema.safeParse(rawResponse);
    if (!parsedResponse.success) {
      return errorResult(
        "invalid_service_response",
        "Teacher Desk AI returned an invalid response.",
      );
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: parsedResponse.data.code ?? "assistant_request_failed",
          message: parsedResponse.data.error ?? "Teacher Desk AI could not process this request.",
        },
        response: parsedResponse.data,
      };
    }

    return { ok: true, response: parsedResponse.data };
  });
