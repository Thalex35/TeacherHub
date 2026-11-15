import { createClient } from "@supabase/supabase-js";

import type { Database } from "../../integrations/supabase/types.ts";
import {
  CalendarEventServiceError,
  createCalendarEvent,
  type CalendarEventRepository,
} from "./calendar-event-service.ts";

export class CalendarEventEndpointError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "CalendarEventEndpointError";
  }
}

type UserClient = ReturnType<typeof createUserScopedClient>;

export type AuthenticatedCalendarRequest = {
  userId: string;
  accessToken: string;
  supabase: UserClient;
};

export type CalendarEventEndpointDependencies = {
  authenticate: (request: Request) => Promise<AuthenticatedCalendarRequest>;
  createRepository: (context: AuthenticatedCalendarRequest) => CalendarEventRepository;
};

function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ error: message, code }, { status });
}

function createUserScopedClient(url: string, publishableKey: string, accessToken: string) {
  const customFetch: typeof fetch = (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));

    if (
      (publishableKey.startsWith("sb_publishable_") || publishableKey.startsWith("sb_secret_")) &&
      headers.get("Authorization") === `Bearer ${publishableKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", publishableKey);
    return fetch(input, { ...init, headers });
  };

  return createClient<Database>(url, publishableKey, {
    global: {
      fetch: customFetch,
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isProfileStatusRows(value: unknown): value is { account_status: string }[] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) =>
        typeof row === "object" &&
        row !== null &&
        "account_status" in row &&
        typeof row.account_status === "string",
    )
  );
}

export async function authenticateCalendarRequest(
  request: Request,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): Promise<AuthenticatedCalendarRequest> {
  const authorization = request.headers.get("authorization");
  const tokenMatch = authorization?.match(/^Bearer ([^\s]+)$/);
  const accessToken = tokenMatch?.[1];
  if (!accessToken || accessToken.split(".").length !== 3) {
    throw new CalendarEventEndpointError(401, "unauthorized", "A valid bearer token is required.");
  }

  const supabaseUrl = environment["SUPABASE_URL"];
  const publishableKey = environment["SUPABASE_PUBLISHABLE_KEY"];
  if (!supabaseUrl || !publishableKey) {
    throw new CalendarEventEndpointError(
      500,
      "configuration_error",
      "The calendar service is not configured.",
    );
  }

  const supabase = createUserScopedClient(supabaseUrl, publishableKey, accessToken);
  const { data, error } = await supabase.auth.getClaims(accessToken);
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string" || !userId) {
    throw new CalendarEventEndpointError(401, "unauthorized", "The bearer token is invalid.");
  }

  const profileUrl = new URL("/rest/v1/profiles", supabaseUrl);
  profileUrl.searchParams.set("select", "account_status");
  profileUrl.searchParams.set("id", `eq.${userId}`);
  const profileResponse = await fetch(profileUrl, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!profileResponse.ok) {
    throw new CalendarEventEndpointError(
      503,
      "profile_check_failed",
      "Teacher approval could not be verified.",
    );
  }

  const profileRows: unknown = await profileResponse.json();
  if (!isProfileStatusRows(profileRows) || profileRows.length !== 1) {
    throw new CalendarEventEndpointError(
      403,
      "account_not_approved",
      "This account is not approved.",
    );
  }
  const profile = profileRows[0];
  if (!profile || profile.account_status !== "approved") {
    throw new CalendarEventEndpointError(
      403,
      "account_not_approved",
      "This account is not approved.",
    );
  }

  return { userId, accessToken, supabase };
}

export function createSupabaseCalendarEventRepository(
  context: AuthenticatedCalendarRequest,
): CalendarEventRepository {
  return {
    async listAccessibleActiveClasses() {
      const { data, error } = await context.supabase
        .from("classes")
        .select("id,name,section,subject_id")
        .eq("is_active", true);
      if (error) throw new Error("Accessible classes could not be loaded.");
      return data ?? [];
    },
    async insertCalendarEvent(values) {
      const { data, error } = await context.supabase
        .from("calendar_events")
        .upsert(values, {
          onConflict: "owner_id,ai_tool_call_id",
          ignoreDuplicates: true,
        })
        .select(
          "id,title,description,event_date,start_time,end_time,event_type,class_id,subject_id,created_at,updated_at",
        )
        .maybeSingle();
      if (error) throw new Error("The calendar event could not be saved.");
      if (data) return data;

      const { data: existingEvent, error: existingEventError } = await context.supabase
        .from("calendar_events")
        .select(
          "id,title,description,event_date,start_time,end_time,event_type,class_id,subject_id,created_at,updated_at",
        )
        .eq("ai_tool_call_id", values.ai_tool_call_id)
        .single();
      if (existingEventError) throw new Error("The existing calendar event could not be loaded.");
      return existingEvent;
    },
  };
}

export function createCalendarEventPostHandler(
  dependencies: CalendarEventEndpointDependencies = {
    authenticate: authenticateCalendarRequest,
    createRepository: createSupabaseCalendarEventRepository,
  },
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method !== "POST") {
      return jsonError(405, "method_not_allowed", "Use POST to create a calendar event.");
    }

    try {
      const context = await dependencies.authenticate(request);
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
        return jsonError(415, "unsupported_media_type", "Send the event as JSON.");
      }

      const body = await request.text();
      if (new TextEncoder().encode(body).byteLength > 16_384) {
        return jsonError(413, "request_too_large", "The event request is too large.");
      }

      let input: unknown;
      try {
        input = JSON.parse(body);
      } catch {
        return jsonError(400, "invalid_json", "The request body must be valid JSON.");
      }

      const idempotencyKey = request.headers.get("idempotency-key");
      if (!idempotencyKey) {
        return jsonError(400, "invalid_idempotency_key", "An idempotency key is required.");
      }

      const repository = dependencies.createRepository(context);
      const event = await createCalendarEvent(input, repository, idempotencyKey);
      return Response.json({ event }, { status: 201 });
    } catch (error) {
      if (error instanceof CalendarEventEndpointError) {
        return jsonError(error.status, error.code, error.message);
      }
      if (error instanceof CalendarEventServiceError) {
        return jsonError(error.status, error.code, error.message);
      }

      console.error(
        `[calendar-event] request failed (${error instanceof Error ? error.name : "unknown error"})`,
      );
      return jsonError(500, "event_creation_failed", "The calendar event could not be created.");
    }
  };
}
