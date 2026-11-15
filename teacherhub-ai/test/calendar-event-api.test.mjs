import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

import { createCalendarEventTool } from "../tools/create-calendar-event.ts";
import {
  CalendarEventEndpointError,
  createCalendarEventPostHandler,
} from "../../src/lib/server/calendar-event-endpoint.ts";

const activeClasses = [
  { id: "class-7a", name: "Grade 7", section: "A", subject_id: "subject-informatics" },
  { id: "class-8a", name: "Grade 8", section: "A", subject_id: "subject-math" },
];

function eventInput(overrides = {}) {
  return {
    title: "Evaluation Informatique",
    event_date: "2026-11-20",
    start_time: "09:00",
    class_name: "Grade 7",
    section: "A",
    event_type: "exam",
    ...overrides,
  };
}

function createHarness({ classes = activeClasses } = {}) {
  const calendarEvents = [];
  const repository = {
    async listAccessibleActiveClasses() {
      return classes;
    },
    async insertCalendarEvent(values) {
      const existing = calendarEvents.find(
        (event) => event.ai_tool_call_id === values.ai_tool_call_id,
      );
      if (existing) return existing;
      const event = { id: `event-${calendarEvents.length + 1}`, ...values };
      calendarEvents.push(event);
      return event;
    },
    async listCalendarEvents() {
      return calendarEvents;
    },
  };

  const handler = createCalendarEventPostHandler({
    async authenticate(request) {
      const authorization = request.headers.get("authorization");
      if (authorization === "Bearer unapproved-token") {
        throw new CalendarEventEndpointError(
          403,
          "account_not_approved",
          "This account is not approved.",
        );
      }
      if (authorization !== "Bearer approved-token") {
        throw new CalendarEventEndpointError(
          401,
          "unauthorized",
          "A valid bearer token is required.",
        );
      }
      return { userId: "teacher-1", supabase: {} };
    },
    createRepository() {
      return repository;
    },
  });

  return { handler, repository, calendarEvents };
}

function post(
  handler,
  payload,
  token = "approved-token",
  idempotencyKey = randomBytes(32).toString("hex"),
) {
  const headers = {
    "content-type": "application/json",
    "idempotency-key": idempotencyKey,
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return handler(
    new Request("https://teacherhub.test/api/ai/calendar-events", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }),
  );
}

async function assertError(responsePromise, status, code) {
  const response = await responsePromise;
  assert.equal(response.status, status);
  assert.equal((await response.json()).code, code);
}

test("creates a valid event using the authenticated teacher's class", async () => {
  const { handler } = createHarness();
  const response = await post(handler, eventInput());
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.event.class_id, "class-7a");
  assert.equal(body.event.subject_id, "subject-informatics");
  assert.equal(body.event.event_type, "exam");
  assert.equal("owner_id" in body.event, false);
  assert.equal("teacher_id" in body.event, false);
});

test("rejects a missing title", async () => {
  const { handler } = createHarness();
  await assertError(post(handler, eventInput({ title: "  " })), 400, "invalid_event");
});

test("rejects a missing date", async () => {
  const { handler } = createHarness();
  const { event_date, ...withoutDate } = eventInput();
  void event_date;
  await assertError(post(handler, withoutDate), 400, "invalid_event");
});

test("rejects an invalid calendar date", async () => {
  const { handler } = createHarness();
  await assertError(post(handler, eventInput({ event_date: "2026-02-30" })), 400, "invalid_event");
});

test("rejects an invalid time", async () => {
  const { handler } = createHarness();
  await assertError(post(handler, eventInput({ start_time: "9:00" })), 400, "invalid_event");
});

test("rejects an end time before the start time", async () => {
  const { handler } = createHarness();
  await assertError(
    post(handler, eventInput({ start_time: "10:00", end_time: "09:00" })),
    400,
    "invalid_event",
  );
});

test("rejects an event type outside the existing application values", async () => {
  const { handler } = createHarness();
  await assertError(post(handler, eventInput({ event_type: "holiday" })), 400, "invalid_event");
});

test("rejects a class that is not accessible to the authenticated teacher", async () => {
  const { handler } = createHarness();
  await assertError(post(handler, eventInput({ class_name: "Grade 9" })), 404, "class_not_found");
});

test("rejects ambiguous class names without a distinguishing section", async () => {
  const { handler } = createHarness({
    classes: [
      { id: "class-7a", name: "Grade 7", section: "A", subject_id: "subject-a" },
      { id: "class-7b", name: "Grade 7", section: "B", subject_id: "subject-b" },
    ],
  });
  await assertError(post(handler, eventInput({ section: undefined })), 409, "class_ambiguous");
});

test("rejects unauthenticated teachers without writing", async () => {
  const { handler, calendarEvents } = createHarness();
  await assertError(post(handler, eventInput(), null), 401, "unauthorized");
  assert.equal(calendarEvents.length, 0);
});

test("rejects an unapproved account without writing", async () => {
  const { handler, calendarEvents } = createHarness();
  await assertError(post(handler, eventInput(), "unapproved-token"), 403, "account_not_approved");
  assert.equal(calendarEvents.length, 0);
});

test("a successful insert is visible in the existing calendar event store", async () => {
  const { handler, repository } = createHarness();
  const response = await post(handler, eventInput());
  const created = (await response.json()).event;
  const visibleEvents = await repository.listCalendarEvents();

  assert.equal(visibleEvents.length, 1);
  assert.equal(visibleEvents[0].id, created.id);
  assert.equal(visibleEvents[0].title, "Evaluation Informatique");
});

test("retries with the same idempotency key return one existing event", async () => {
  const { handler, calendarEvents } = createHarness();
  const key = "a".repeat(64);
  const first = await post(handler, eventInput(), "approved-token", key);
  const second = await post(handler, eventInput(), "approved-token", key);

  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal((await first.json()).event.id, (await second.json()).event.id);
  assert.equal(calendarEvents.length, 1);
});

test("does not call TeacherHub until the ADK confirmation is approved", async () => {
  const requests = [];
  const tool = createCalendarEventTool({
    accessToken: "request-scoped-token",
    teacherHubBaseUrl: "https://teacherhub.test",
    async fetchImplementation(url, init) {
      requests.push({ url: String(url), init });
      return Response.json(
        { event: { id: "event-1", title: "Evaluation Informatique" } },
        {
          status: 201,
        },
      );
    },
  });
  let confirmationHint = "";
  const toolContext = {
    functionCallId: "calendar-tool-call-1",
    actions: {},
    requestConfirmation({ hint }) {
      confirmationHint = hint;
    },
  };
  const args = eventInput();

  await tool.runAsync({ args, toolContext });
  assert.equal(requests.length, 0);
  assert.match(confirmationHint, /Create this event\?/);
  assert.match(confirmationHint, /November 20, 2026/);

  await tool.runAsync({
    args,
    toolContext: { ...toolContext, toolConfirmation: { confirmed: true } },
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].init.headers.authorization, "Bearer request-scoped-token");
  assert.equal(JSON.stringify(requests[0].init.body).includes("request-scoped-token"), false);
});

test("rejects model-supplied identity and database identifiers", async () => {
  const { handler, calendarEvents } = createHarness();
  await assertError(
    post(handler, eventInput({ teacher_id: "other-teacher", class_id: "other-class" })),
    400,
    "invalid_event",
  );
  assert.equal(calendarEvents.length, 0);
});
