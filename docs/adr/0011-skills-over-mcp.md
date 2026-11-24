# ADR 0011: Skills over MCP

**Status:** Proposed
**Amends:** [ADR 0006](0006-hosted-mcp-server.md), whose snapshot gains the skill files.

## Context

The MCP server tells an agent what each record is. It does not say how to work with the spec. That
lives in one block of instructions (`packages/spec/src/agents.js`) that the server sends when a
client connects: search first, `get` with `--impl`, read `setup` once, read `guideline.page-setup`
before building a page, and cite rules by address when reviewing. Every agent pays for all of it,
whatever the task.

The MCP extension `io.modelcontextprotocol/skills` (SEP-2640, Final) lets a server publish skills.
A skill is a folder with a `SKILL.md` that starts with a `name` and `description`, plus optional
reference files, in the Agent Skills format our `.agents/skills/` folders already use. A client
lists the skills, loads one only when a task calls for it, and reads its files through
`resources/read` at `skill://<name>/...` addresses. A skill changes when the server deploys, so
users install nothing.

Three facts limit what we can do today:

- The extension needs protocol revision `2026-07-28`. We use `@modelcontextprotocol/sdk` 1.30.1,
  and the newest 1.x release (1.32.2) still stops at `2025-11-25`. Support is in the v2 packages:
  `@modelcontextprotocol/server` 2.4.0 has `ext/skills`, with `loadSkills(folder)` for Node,
  `memorySkillFiles(files)` for hosts without a file system, and `skills.attach(server)`.
- Claude Code loads MCP skills in the terminal, VS Code, and the desktop Code tab. It does not load
  them in `claude -p`, cloud sessions, or the Agent SDK. Our evals run through `claude -p`.
- Claude Code allows at most 100 skills per server, 100 KB per text file, and 400 KB per skill.

## Decision

**Upgrade the server to the v2 SDK first.** `packages/spec` moves from `@modelcontextprotocol/sdk`
to the v2 packages and protocol `2026-07-28`. The tools, their descriptions, and their output do
not change. This is its own change, merged and deployed before any skill ships, so a regression
points at the upgrade alone.

**Skills hold workflow, not facts.** A skill says which tools to call, in what order, and which
records to read. It names records by id or rule address and never restates a parameter, rule,
token, or value. The spec stays the source of truth, as ADR 0001 requires. A test resolves every
record id and rule address a skill names, so a rename fails the build instead of leaving a dead
link.

**Skills for people who build with Taproot live in `packages/spec/skills/`.** Each is a folder
named after the skill, published in the npm package next to `content/`. The skills in
`.agents/skills/` stay where they are: `spec-component`, `implement-component`, and `verify` are
for people who work on this repository, and the server does not serve them.

**Start with two skills.** `build-with-taproot` covers choosing a component, reading its
implementation, one-time setup, and page setup. `review-with-taproot` covers checking work against
`rules`, including inherited rules, and citing each by address and level. `design-tokens` moves
here later if its guidance can be cut down to workflow that points at token records.

**One loader, two hosts.** The local server serves the folder with `loadSkills`. The snapshot
build reads the same folder into the snapshot, and the hosted server serves it with
`memorySkillFiles`. Both run through the same server core, as ADR 0006 requires.

**Keep the instructions in full for now.** Clients without the extension still need them, and our
evals cannot yet measure whether skills replace them. Cutting the instructions down is a separate
decision, made once an eval can load skills.

## Consequences

- Agents in clients that support the extension load guidance per task, and see the skills as
  `/taproot:build-with-taproot` and `/taproot:review-with-taproot` in Claude Code.
- The v2 upgrade touches `server.js`, `http.js`, `mcp.js`, and the Cloudflare entry. The parity
  test and the server tests must pass unchanged. We need to confirm that clients on older protocol
  revisions still connect.
- The snapshot grows by the skill files, a few kilobytes.
- There is a second place to keep in step with the spec. The reference test catches renames but
  not a skill whose advice has gone stale, so review checks that.
- The evals measure the tools and the instructions but not skills until they run in a client that
  loads them.

## Alternatives considered

**Serve the skills as MCP prompts.** Prompts are user-invoked templates with no supporting files,
and clients do not load them on their own. Rejected.

**Serve every skill in `.agents/skills/`.** Agents using Taproot in their own projects would see
repository workflows such as building a component here. Rejected.

**Put workflow guidance in spec records.** Records describe the design system, not how an agent
uses the tools, and `get` would serve it as part of the system. Rejected.

**Wait for skills support in the 1.x SDK.** No 1.x release supports protocol `2026-07-28`, and
nothing says one will. Rejected.

**Replace the instructions with skills now.** Clients without the extension would lose all
workflow guidance, and we could not measure the change. Rejected.
