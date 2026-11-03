import { handleMcpRequest } from "@stevegreco/design-system-spec/http";
import snapshot from "../dist/snapshot.json";

export default {
  fetch(request) {
    if (new URL(request.url).pathname !== "/mcp") {
      return new Response("The design system spec MCP server is at /mcp.\n", { status: 404 });
    }
    return handleMcpRequest(snapshot, request);
  },
};
