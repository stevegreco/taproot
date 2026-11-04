# CLI Explorer

A local web page for trying `taproot` commands and seeing what they return. Each run calls the
real CLI twice and shows both outputs side by side: the Markdown an agent reads and the `--json`
data, plus the exit code and any warnings. A switcher in the corner picks the system, light, or dark
theme and remembers the choice.

The page is styled with the design system's tokens. From the repository root, Turbo builds them
first and starts the server:

```bash
pnpm exec turbo run dev --filter=cli-explorer
```

Then open http://localhost:4400. Once the tokens are built, `node apps/cli-explorer/server.js`
starts it faster. Set `PORT` to use another port. The server listens on localhost only.

To try the MCP tools instead, use the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node packages/spec/bin/taproot-mcp.js
```
