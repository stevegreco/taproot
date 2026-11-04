# Hosted MCP server

Serves the design system spec over HTTP from a snapshot built during `pnpm build`. Why it works this
way is in [ADR 0006](../../docs/adr/0006-hosted-mcp-server.md). The tools live in `packages/spec`.
Each host has one small entry file in `src/`.

It is live at `https://mcp.stevegreco.workers.dev/mcp`.

```bash
pnpm exec turbo run dev --filter=mcp
```

The server is at `http://localhost:8787/mcp`.
