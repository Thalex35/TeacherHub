import { createServer } from "node:http";

import { aiChatHandler } from "./chat-api.ts";

const host = process.env["AI_HOST"] ?? "127.0.0.1";
const portValue = Number(process.env["AI_PORT"] ?? "3210");

if (!Number.isInteger(portValue) || portValue < 1 || portValue > 65_535) {
  throw new Error("AI_PORT must be a valid TCP port.");
}

const server = createServer(async (incoming, outgoing) => {
  const requestUrl = new URL(incoming.url ?? "/", "http://teacherhub-ai.local");
  if (requestUrl.pathname === "/health" && incoming.method === "GET") {
    outgoing.writeHead(200, { "content-type": "application/json" });
    outgoing.end(JSON.stringify({ status: "ok" }));
    return;
  }
  if (requestUrl.pathname !== "/api/chat") {
    outgoing.writeHead(404, { "content-type": "application/json" });
    outgoing.end(JSON.stringify({ error: "Not found.", code: "not_found" }));
    return;
  }

  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (typeof value === "string") headers.set(name, value);
    else if (Array.isArray(value)) headers.set(name, value.join(", "));
  }

  let requestBody: Buffer;
  try {
    const chunks: Buffer[] = [];
    let byteLength = 0;
    for await (const chunk of incoming) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      byteLength += buffer.byteLength;
      if (byteLength > 16_384) {
        outgoing.writeHead(413, { "content-type": "application/json" });
        outgoing.end(
          JSON.stringify({
            error: "The assistant request is too large.",
            code: "request_too_large",
          }),
        );
        incoming.destroy();
        return;
      }
      chunks.push(buffer);
    }
    requestBody = Buffer.concat(chunks);
  } catch (error) {
    console.error(
      `[teacherhub-ai] request read failed (${error instanceof Error ? error.name : "unknown error"})`,
    );
    if (!outgoing.headersSent) {
      outgoing.writeHead(400, { "content-type": "application/json" });
      outgoing.end(
        JSON.stringify({ error: "The request body could not be read.", code: "invalid_body" }),
      );
    }
    return;
  }

  try {
    const requestInit: RequestInit = { headers };
    if (incoming.method !== undefined) requestInit.method = incoming.method;
    if (incoming.method !== "GET" && incoming.method !== "HEAD") {
      requestInit.body = requestBody.toString("utf8");
    }
    const request = new Request(requestUrl, requestInit);
    const response = await aiChatHandler(request);
    const responseHeaders = Object.fromEntries(response.headers.entries());
    outgoing.writeHead(response.status, responseHeaders);
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(
      `[teacherhub-ai] request failed (${error instanceof Error ? error.name : "unknown error"})`,
    );
    if (!outgoing.headersSent) {
      outgoing.writeHead(500, { "content-type": "application/json" });
      outgoing.end(
        JSON.stringify({ error: "The assistant request failed.", code: "request_failed" }),
      );
    }
  }
});

server.listen(portValue, host, () => {
  console.log(`TeacherHub AI service listening on ${host}:${portValue}`);
});
