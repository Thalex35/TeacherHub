import assert from "node:assert/strict";
import test from "node:test";

import { BaseLlm, InMemorySessionService } from "@google/adk";
import { createAiChatHandler } from "../chat-api.ts";
import { CalendarEventEndpointError } from "../../src/lib/server/calendar-event-endpoint.ts";

const serviceToken = "test-service-token";
const accessToken = "test.teacher.access.token";
const eventArguments = {
  title: "Safe test event",
  event_date: "2026-11-20",
  start_time: "09:00",
  class_name: "Grade 7",
  section: "A",
  event_type: "exam",
};

class ScriptedModel extends BaseLlm {
  calls = 0;
  observedContents = [];

  constructor() {
    super({ model: "teacherhub-chat-test" });
  }

  async *generateContentAsync(request) {
    this.calls += 1;
    this.observedContents.push(JSON.stringify(request.contents));
    if (this.calls === 1) {
      yield {
        content: {
          role: "model",
          parts: [
            {
              functionCall: {
                id: "calendar-tool-call-1",
                name: "create_calendar_event",
                args: eventArguments,
              },
            },
          ],
        },
        turnComplete: true,
      };
      return;
    }

    yield {
      content: { role: "model", parts: [{ text: "The event is ready in your calendar." }] },
      turnComplete: true,
    };
  }

  async connect() {
    throw new Error("The test model does not support live connections.");
  }
}

function createHarness() {
  const model = new ScriptedModel();
  const writes = [];
  const sessionService = new InMemorySessionService();
  const handler = createAiChatHandler({
    authenticate: async (request) => {
      const token = request.headers.get("authorization");
      if (token === "Bearer expired-token") {
        throw new CalendarEventEndpointError(401, "unauthorized", "Invalid bearer token.");
      }
      if (token !== `Bearer ${accessToken}`) {
        throw new CalendarEventEndpointError(401, "unauthorized", "Invalid bearer token.");
      }
      return { userId: "teacher-user-1", accessToken };
    },
    sessionService,
    serviceToken,
    teacherHubBaseUrl: "https://teacherhub.test",
    model,
    fetchImplementation: async (url, init) => {
      writes.push({ url: String(url), init });
      return Response.json(
        {
          event: {
            id: "created-event-1",
            title: eventArguments.title,
            event_date: eventArguments.event_date,
            start_time: eventArguments.start_time,
            end_time: null,
            description: null,
            event_type: eventArguments.event_type,
          },
        },
        { status: 201 },
      );
    },
    now: () => Date.now(),
  });

  return { handler, model, writes, sessionService };
}

function makeRequest(body, token = accessToken, includeServiceToken = true) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (includeServiceToken) headers["x-teacherhub-ai-service-token"] = serviceToken;
  return new Request("https://ai.test/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function startConfirmation(handler) {
  const response = await handler(
    makeRequest({ message: "Create a safe test event for Grade 7A." }),
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.pendingConfirmations.length, 1);
  assert.equal(body.pendingConfirmations[0].toolName, "create_calendar_event");
  assert.match(body.pendingConfirmations[0].message, /Create this event\?/);
  return body;
}

test("the Runner pauses for confirmation, resumes, and returns the created event", async () => {
  const { handler, model, writes } = createHarness();
  const pending = await startConfirmation(handler);

  assert.equal(writes.length, 0);
  assert.deepEqual(pending.pendingConfirmations[0].event, eventArguments);

  const response = await handler(
    makeRequest({
      sessionId: pending.sessionId,
      confirmation: {
        interruptId: pending.pendingConfirmations[0].interruptId,
        confirmed: true,
      },
    }),
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.pendingConfirmations.length, 0);
  assert.deepEqual(body.createdEvents, [
    {
      id: "created-event-1",
      title: eventArguments.title,
      event_date: eventArguments.event_date,
      start_time: eventArguments.start_time,
      end_time: null,
      description: null,
      event_type: eventArguments.event_type,
    },
  ]);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].url, "https://teacherhub.test/api/ai/calendar-events");
  assert.equal(writes[0].init.headers.authorization, `Bearer ${accessToken}`);
  assert.equal(JSON.stringify(model.observedContents).includes(accessToken), false);
  assert.equal(JSON.stringify(body).includes(accessToken), false);
});

test("declining a confirmation resumes the Runner without writing", async () => {
  const { handler, writes } = createHarness();
  const pending = await startConfirmation(handler);

  const response = await handler(
    makeRequest({
      sessionId: pending.sessionId,
      confirmation: {
        interruptId: pending.pendingConfirmations[0].interruptId,
        confirmed: false,
      },
    }),
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.pendingConfirmations.length, 0);
  assert.equal(writes.length, 0);
});

test("a session cannot be resumed by another authenticated user", async () => {
  const { handler, sessionService } = createHarness();
  const pending = await startConfirmation(handler);
  const anotherUserHandler = createAiChatHandler({
    authenticate: async () => ({ userId: "teacher-user-2", accessToken }),
    sessionService,
    serviceToken,
    teacherHubBaseUrl: "https://teacherhub.test",
    model: new ScriptedModel(),
    now: () => Date.now(),
  });

  const response = await anotherUserHandler(
    makeRequest({
      sessionId: pending.sessionId,
      confirmation: {
        interruptId: pending.pendingConfirmations[0].interruptId,
        confirmed: true,
      },
    }),
  );

  assert.equal(response.status, 404);
  assert.equal((await response.json()).code, "session_not_found");
});

test("rejects a stale confirmation and invalid authentication", async () => {
  const { handler, writes } = createHarness();
  const pending = await startConfirmation(handler);
  const staleConfirmation = await handler(
    makeRequest({
      sessionId: pending.sessionId,
      confirmation: { interruptId: "stale-interrupt", confirmed: true },
    }),
  );
  assert.equal(staleConfirmation.status, 409);
  assert.equal((await staleConfirmation.json()).code, "confirmation_not_pending");

  const expiredAuth = await handler(
    makeRequest({ message: "A harmless message." }, "expired-token"),
  );
  assert.equal(expiredAuth.status, 401);
  assert.equal((await expiredAuth.json()).code, "unauthorized");

  const missingServiceToken = await handler(
    makeRequest({ message: "A harmless message." }, accessToken, false),
  );
  assert.equal(missingServiceToken.status, 401);
  assert.equal((await missingServiceToken.json()).code, "unauthorized");
  assert.equal(writes.length, 0);
});
