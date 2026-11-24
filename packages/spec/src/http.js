import { createMcpHandler } from "@modelcontextprotocol/server";
import { createSnapshotServer } from "./server.js";

/**
 * Answer one MCP request over HTTP from a snapshot, with a standard web `Request` and `Response`,
 * so any host can call it. A host keeps nothing between requests, so each gets its own server, with
 * no session and a plain JSON answer. Clients on protocol `2026-07-28` and on the 2025 revisions
 * are both served.
 *
 * @param {import("./snapshot.js").Snapshot} snapshot
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function handleMcpRequest(snapshot, request) {
  // GET would hold a stream open for messages this server never sends, and DELETE ends a session it
  // does not have. The MCP specification lets a server answer both with 405.
  if (request.method !== "POST") {
    return new Response("This server answers POST only.\n", {
      status: 405,
      headers: { allow: "POST" },
    });
  }
  const handler = createMcpHandler(() => createSnapshotServer(snapshot), { responseMode: "json" });
  return handler.fetch(request);
}
