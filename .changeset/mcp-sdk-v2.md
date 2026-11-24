---
"@taproot-ds/spec": minor
---

The MCP server runs on the v2 MCP SDK (`@modelcontextprotocol/server`) and serves clients on protocol `2026-07-28` as well as the 2025 revisions, over stdio and HTTP. Tools and their answers do not change. Code that connects the server from `createServer` or `createSpecServer` to its own transport must use v2 SDK transports.
