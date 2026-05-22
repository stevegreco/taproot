# ADR 0001 — MCP Token Server reads from built dist output

**Status:** Accepted

## Context

The MCP token server needs to read token data from somewhere. Two candidates:

- **Source files** (`tokens/**/*.tokens.json`) — always current, but contain unresolved alias references (e.g. `{semantic.color.accent.default}`) that the MCP would need to resolve itself, reimplementing Style Dictionary's resolution logic.
- **Built output** (`dist/tokens/*.json`) — fully resolved values ready to serve, but can go stale if token source files are edited without running `pnpm build`.

## Decision

Read from `dist/tokens/`. Detect staleness by comparing source file `mtime` against dist file `mtime` on every tool call, and surface a warning in the response when out of sync.

## Consequences

- No need to reimplement Style Dictionary alias resolution in the MCP.
- Users get a clear signal when data is stale rather than silently wrong results.
- The MCP is only as good as the last build — users must run `pnpm build` to reflect token changes.
- Alias chains (raw references) are not available to the MCP without also reading source files. Deferred to a future version alongside reverse lookup.
