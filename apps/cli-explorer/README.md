# CLI Explorer

A local web page for trying `ds-spec` commands and seeing what they return. Each run calls the
real CLI twice and shows both outputs side by side: the Markdown an agent reads and the `--json`
data, plus the exit code and any warnings.

From the repository root:

```bash
node apps/cli-explorer/server.js
```

Then open http://localhost:4400. Set `PORT` to use another port. The server listens on localhost
only and has no dependencies.

To try the MCP tools instead, use the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node packages/spec/bin/ds-spec-mcp.js
```
