import { createFileRoute } from "@tanstack/react-router";

import { createCalendarEventPostHandler } from "@/lib/server/calendar-event-endpoint";

const handleCalendarEventPost = createCalendarEventPostHandler();

export const Route = createFileRoute("/api/ai/calendar-events")({
  server: {
    handlers: {
      POST: ({ request }) => handleCalendarEventPost(request),
    },
  },
});
