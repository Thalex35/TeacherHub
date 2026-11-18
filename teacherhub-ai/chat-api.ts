import {
  getPendingUserInputRequests,
  InMemorySessionService,
  Runner,
  type BaseLlm,
  type BaseSessionService,
  type Event,
} from "@google/adk";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

import {
  CalendarEventEndpointError,
  authenticateCalendarRequest,
} from "../src/lib/server/calendar-event-endpoint.ts";
import { createAuthenticatedRootAgent, type AuthenticatedAgentOptions } from "./agent.ts";

const APP_NAME = "teacherhub_assistant";
const AGENT_NAME = "teacherhub_assistant";
const MAX_BODY_BYTES = 16_384;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_SESSION_EVENTS = 300;
const SESSION_TTL_MS = 24 * 60 * 60 * 1_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 30;

const sessionIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);
const chatRequestSchema = z.union([
  z
    .object({
      message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
      sessionId: sessionIdSchema.optional(),
    })
    .strict(),
  z
    .object({
      sessionId: sessionIdSchema,
      confirmation: z
        .object({
          interruptId: z.string().min(1).max(256),
          confirmed: z.boolean(),
        })
        .strict(),
    })
    .strict(),
]);

type ChatRequest = z.infer<typeof chatRequestSchema>;
type AuthenticatedChatContext = {
  userId: string;
  accessToken: string;
};

type ChatAgentOptions = Required<
  Pick<AuthenticatedAgentOptions, "accessToken" | "teacherHubBaseUrl">
> &
  Pick<AuthenticatedAgentOptions, "fetchImplementation" | "model">;

type ChatApiDependencies = {
  authenticate: (request: Request) => Promise<AuthenticatedChatContext>;
  sessionService: BaseSessionService;
  serviceToken: string | undefined;
  teacherHubBaseUrl: string | undefined;
  createAgent: (options: ChatAgentOptions) => ReturnType<typeof createAuthenticatedRootAgent>;
  model?: string | BaseLlm;
  fetchImplementation?: typeof fetch;
  now: () => number;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type PendingConfirmation = {
  interruptId: string;
  toolName: string;
  message: string;
  event?: z.infer<typeof eventPreviewSchema>;
};

const eventPreviewSchema = z
  .object({
    title: z.string(),
    event_date: z.string(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    class_name: z.string().optional(),
    section: z.string().optional(),
    description: z.string().optional(),
    event_type: z.string(),
  })
  .strict();

type CreatedEvent = {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  event_type: string;
};

function jsonError(status: number, code: string, message: string, extra = {}) {
  return Response.json({ error: message, code, ...extra }, { status });
}

function serviceTokenMatches(request: Request, expectedToken: string): boolean {
  const provided = request.headers.get("x-teacherhub-ai-service-token");
  if (!provided) return false;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expectedToken);
  return (
    providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes)
  );
}

function getTrustedTeacherHubBaseUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const isLocalHttp =
      url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.protocol !== "https:" && !isLocalHttp) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

function getTranscript(events: Event[]): ChatMessage[] {
  return events
    .flatMap((event) => {
      const role: ChatMessage["role"] | undefined =
        event.author === "user" ? "user" : event.author === AGENT_NAME ? "assistant" : undefined;
      if (!role) return [];

      const text = (event.content?.parts ?? [])
        .map((part) => part.text)
        .filter((part): part is string => typeof part === "string")
        .join("\n")
        .trim();
      return text ? [{ id: event.id, role, text }] : [];
    })
    .slice(-100);
}

function getPendingConfirmations(events: Event[]): PendingConfirmation[] {
  return getPendingUserInputRequests(events)
    .filter((request) => request.kind === "confirmation")
    .map((request) => {
      const payload =
        typeof request.payload === "object" && request.payload !== null
          ? (request.payload as Record<string, unknown>)
          : undefined;
      const parsedEvent = payload ? eventPreviewSchema.safeParse(payload["event"]) : undefined;
      return {
        interruptId: request.interruptId,
        toolName: request.toolName ?? "",
        message: request.message ?? "The assistant is requesting confirmation.",
        ...(parsedEvent?.success ? { event: parsedEvent.data } : {}),
      };
    });
}

function isCreatedEvent(value: unknown): value is CreatedEvent {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event["id"] === "string" &&
    typeof event["title"] === "string" &&
    typeof event["event_date"] === "string" &&
    (typeof event["start_time"] === "string" || event["start_time"] === null) &&
    (typeof event["end_time"] === "string" || event["end_time"] === null) &&
    (typeof event["description"] === "string" || event["description"] === null) &&
    typeof event["event_type"] === "string"
  );
}

function getCreatedEvents(events: Event[], afterEventCount: number): CreatedEvent[] {
  const created = new Map<string, CreatedEvent>();
  for (const event of events.slice(afterEventCount)) {
    for (const part of event.content?.parts ?? []) {
      const response = part.functionResponse;
      if (response?.name !== "create_calendar_event") continue;
      const result = response.response;
      if (typeof result !== "object" || result === null || Array.isArray(result)) continue;
      const eventValue = (result as Record<string, unknown>)["event"];
      if (isCreatedEvent(eventValue)) created.set(eventValue.id, eventValue);
    }
  }
  return [...created.values()];
}

function withLock<T>(
  locks: Map<string, Promise<void>>,
  key: string,
  action: () => Promise<T>,
): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  let release = () => {};
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.then(() => hold);
  locks.set(key, tail);

  return previous.then(action).finally(() => {
    release();
    if (locks.get(key) === tail) locks.delete(key);
  });
}

export function createAiChatHandler(
  overrides: Partial<ChatApiDependencies> = {},
): (request: Request) => Promise<Response> {
  const dependencies: ChatApiDependencies = {
    authenticate: async (request) => {
      const context = await authenticateCalendarRequest(request, process.env);
      return { userId: context.userId, accessToken: context.accessToken };
    },
    sessionService: new InMemorySessionService(),
    serviceToken: process.env["TEACHERHUB_AI_SERVICE_TOKEN"],
    teacherHubBaseUrl: process.env["TEACHERHUB_BASE_URL"],
    createAgent: (options) => createAuthenticatedRootAgent(options),
    fetchImplementation: fetch,
    now: Date.now,
    ...overrides,
  };
  const locks = new Map<string, Promise<void>>();
  const rateLimits = new Map<string, { startedAt: number; count: number }>();

  return async (request) => {
    if (request.method !== "POST") {
      return jsonError(405, "method_not_allowed", "Use POST to send an assistant turn.");
    }

    if (!dependencies.serviceToken) {
      return jsonError(503, "configuration_error", "The AI service is not configured.");
    }
    if (!serviceTokenMatches(request, dependencies.serviceToken)) {
      return jsonError(401, "unauthorized", "The AI service request is unauthorized.");
    }

    let authenticated: AuthenticatedChatContext;
    try {
      authenticated = await dependencies.authenticate(request);
    } catch (error) {
      if (error instanceof CalendarEventEndpointError) {
        return jsonError(error.status, error.code, error.message);
      }
      console.error(
        `[teacherhub-ai] authentication failed (${error instanceof Error ? error.name : "unknown error"})`,
      );
      return jsonError(
        503,
        "authentication_unavailable",
        "TeacherHub authentication is unavailable.",
      );
    }

    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return jsonError(415, "unsupported_media_type", "Send the assistant turn as JSON.");
    }

    let body: string;
    try {
      body = await request.text();
    } catch {
      return jsonError(400, "invalid_body", "The request body could not be read.");
    }
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return jsonError(413, "request_too_large", "The assistant request is too large.");
    }

    let rawInput: unknown;
    try {
      rawInput = JSON.parse(body);
    } catch {
      return jsonError(400, "invalid_json", "The request body must be valid JSON.");
    }
    const parsedInput = chatRequestSchema.safeParse(rawInput);
    if (!parsedInput.success) {
      return jsonError(400, "invalid_request", "The assistant request is invalid.");
    }

    const rateLimit = rateLimits.get(authenticated.userId);
    const now = dependencies.now();
    if (rateLimit && now - rateLimit.startedAt < RATE_LIMIT_WINDOW_MS) {
      if (rateLimit.count >= RATE_LIMIT_REQUESTS) {
        return jsonError(429, "rate_limited", "Too many assistant requests. Try again shortly.");
      }
      rateLimit.count += 1;
    } else {
      rateLimits.set(authenticated.userId, { startedAt: now, count: 1 });
    }

    const input: ChatRequest = parsedInput.data;
    let session;
    if ("message" in input) {
      session = input.sessionId
        ? await dependencies.sessionService.getSession({
            appName: APP_NAME,
            userId: authenticated.userId,
            sessionId: input.sessionId,
          })
        : await dependencies.sessionService.createSession({
            appName: APP_NAME,
            userId: authenticated.userId,
          });
      if (!session) {
        return jsonError(404, "session_not_found", "This assistant conversation was not found.");
      }
    } else {
      session = await dependencies.sessionService.getSession({
        appName: APP_NAME,
        userId: authenticated.userId,
        sessionId: input.sessionId,
      });
      if (!session) {
        return jsonError(404, "session_not_found", "This assistant conversation was not found.");
      }
    }

    const lockKey = JSON.stringify([authenticated.userId, session.id]);
    return withLock(locks, lockKey, async () => {
      const currentSession = await dependencies.sessionService.getSession({
        appName: APP_NAME,
        userId: authenticated.userId,
        sessionId: session.id,
      });
      if (!currentSession) {
        return jsonError(404, "session_not_found", "This assistant conversation was not found.");
      }
      if (now - currentSession.lastUpdateTime > SESSION_TTL_MS) {
        await dependencies.sessionService.deleteSession({
          appName: APP_NAME,
          userId: authenticated.userId,
          sessionId: session.id,
        });
        return jsonError(410, "session_expired", "This assistant conversation has expired.");
      }
      if (currentSession.events.length >= MAX_SESSION_EVENTS) {
        return jsonError(409, "session_limit", "Start a new assistant conversation to continue.");
      }

      const pending = getPendingConfirmations(currentSession.events);
      let newMessage: {
        role: "user";
        parts: Array<{ text: string } | { functionResponse: Record<string, unknown> }>;
      };
      if ("message" in input) {
        if (pending.length > 0) {
          return Response.json(
            {
              error: "Resolve the pending event confirmation before sending another message.",
              code: "confirmation_pending",
              sessionId: session.id,
              messages: getTranscript(currentSession.events),
              pendingConfirmations: pending,
              createdEvents: [],
            },
            { status: 409 },
          );
        }
        newMessage = { role: "user", parts: [{ text: input.message }] };
      } else {
        const confirmation = pending.find(
          (request) =>
            request.interruptId === input.confirmation.interruptId &&
            request.toolName === "create_calendar_event",
        );
        if (!confirmation) {
          return jsonError(
            409,
            "confirmation_not_pending",
            "This confirmation is invalid, expired, or already handled.",
          );
        }
        newMessage = {
          role: "user",
          parts: [
            {
              functionResponse: {
                id: confirmation.interruptId,
                name: "adk_request_confirmation",
                response: { confirmed: input.confirmation.confirmed },
              },
            },
          ],
        };
      }

      const trustedBaseUrl = getTrustedTeacherHubBaseUrl(dependencies.teacherHubBaseUrl);
      if (!trustedBaseUrl) {
        return jsonError(503, "configuration_error", "The TeacherHub API URL is not configured.");
      }

      const eventCountBeforeTurn = currentSession.events.length;
      const agent = dependencies.createAgent({
        accessToken: authenticated.accessToken,
        teacherHubBaseUrl: trustedBaseUrl,
        ...(dependencies.fetchImplementation
          ? { fetchImplementation: dependencies.fetchImplementation }
          : {}),
        ...(dependencies.model ? { model: dependencies.model } : {}),
      });
      const runner = new Runner({
        appName: APP_NAME,
        agent,
        sessionService: dependencies.sessionService,
      });

      let runError: unknown;
      try {
        for await (const _event of runner.runAsync({
          userId: authenticated.userId,
          sessionId: session.id,
          newMessage,
        })) {
          // The session service records each event for the response and next turn.
        }
      } catch (error) {
        runError = error;
      }

      const updatedSession = await dependencies.sessionService.getSession({
        appName: APP_NAME,
        userId: authenticated.userId,
        sessionId: session.id,
      });
      if (!updatedSession) {
        return jsonError(
          500,
          "session_unavailable",
          "The assistant conversation could not be loaded.",
        );
      }

      const createdEvents = getCreatedEvents(updatedSession.events, eventCountBeforeTurn);
      const response = {
        sessionId: session.id,
        messages: getTranscript(updatedSession.events),
        pendingConfirmations: getPendingConfirmations(updatedSession.events),
        createdEvents,
        ...(runError
          ? {
              warning:
                createdEvents.length > 0
                  ? "The event was saved, but the assistant response did not finish."
                  : "The assistant could not finish this turn. You can retry safely.",
            }
          : {}),
      };

      if (runError && createdEvents.length === 0) {
        console.error(
          `[teacherhub-ai] turn failed (${runError instanceof Error ? runError.name : "unknown error"})`,
        );
        return Response.json(
          { ...response, error: "The assistant could not finish this turn.", code: "turn_failed" },
          { status: 502 },
        );
      }
      if (runError) {
        console.error(
          `[teacherhub-ai] post-write turn failed (${runError instanceof Error ? runError.name : "unknown error"})`,
        );
      }
      return Response.json(response);
    });
  };
}

export const aiChatHandler = createAiChatHandler();
