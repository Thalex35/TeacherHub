import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryRunner, isFinalResponse, LlmAgent } from "@google/adk";
import { rootAgent } from "../agent.ts";

test("root agent imports with a valid configuration", () => {
  assert.ok(rootAgent instanceof LlmAgent);
  assert.equal(rootAgent.name, "teacherhub_assistant");
  assert.equal(rootAgent.model, "gemini-3.5-flash-lite");
  assert.equal(typeof rootAgent.instruction, "string");
  assert.ok(rootAgent.instruction.trim().length > 0);
});

test("root agent receives a harmless response from Gemini", { timeout: 90_000 }, async () => {
  assert.ok(
    process.env.GOOGLE_GENAI_API_KEY,
    "GOOGLE_GENAI_API_KEY must be set in teacherhub-ai/.env",
  );

  const runner = new InMemoryRunner({ agent: rootAgent });
  let responseText = "";

  try {
    for await (const event of runner.runEphemeral({
      userId: "teacherhub-ai-smoke-test",
      newMessage: {
        role: "user",
        parts: [{ text: "Reply with exactly the word PONG." }],
      },
    })) {
      if (isFinalResponse(event)) {
        responseText = (event.content?.parts ?? []).map((part) => part.text ?? "").join("");
      }
    }
  } finally {
    await runner.close();
  }

  assert.match(responseText, /\bPONG\b/i, "Gemini returned no expected response");
});
