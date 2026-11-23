import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

import {
  authenticateCalendarRequest,
  createCalendarEventPostHandler,
  createSupabaseCalendarEventRepository,
} from "@/lib/server/calendar-event-endpoint";

const handleCalendarEventPost = createCalendarEventPostHandler({
  authenticate: (request) => authenticateCalendarRequest(request, env),
  createRepository: createSupabaseCalendarEventRepository,
});

export const Route = createFileRoute("/api/ai/calendar-events")({
  server: {
    handlers: {
      POST: ({ request }) => handleCalendarEventPost(request),
    },
  },
});
