# GARAGE.md — Ember & Sage
_Checked in: 2026-11-04 · Carried forward from the 2026-10-29 profile · Re-confirm at next inspection_

## Vehicle
- System: Ember & Sage, an agent-first token, spec, and web-component design system
- Team: solo (Steve Greco), working with coding agents · Consumers: some, not enumerated (reported 2026-10-29, not re-confirmed)
- Age: first commit 2026-05-05, 523 commits on `main`; spec rebuild and first 20 components in 2026-10; first Changesets release 2026-11-03
- Reason for service: routine re-inspection of `main` at 136030d, after the npm release and the docs simplification

## Assets
- Design library: none. The spec plays the contract role (not re-asked this pass; see the access map)
- Code library: pnpm and Turbo monorepo, private GitHub repo `stevegreco/design-system`
  - `@stevegreco/design-system` 0.1.1: tokens, DTCG JSON through Style Dictionary to CSS and JSON
  - `@stevegreco/web-components` 0.1.1: 20 hand-written web components
  - `@stevegreco/design-system-spec` 0.2.0: 25 records, `ds-spec` CLI, MCP server
  - `@stevegreco/react-components` 0.0.1: private, 8 components on React Aria Components
- Docs: Blume site at `docs.stevegreco.workers.dev` for orientation, with one generated catalog page (ADR 0007). Storybook at `storybook.stevegreco.workers.dev` as a workbench
- Process: GitHub issues (P0–P3 and domain labels), Changesets with a release workflow, per-package changelogs, ADRs, two-phase component skills in `.agents/skills`
- AI surface: hosted MCP at `mcp.stevegreco.workers.dev/mcp`, local MCP (`.mcp.json`), `ds-spec` CLI in the npm package, `llms.txt` and `llms-full.txt`, `AGENTS.md`, agent skills

## Evidence access map
| Asset | Access | Verified how |
|---|---|---|
| Design library | none | Figma MCP `whoami` answered (View seat, Starter plan), but no file was named to read. Earlier profiles record the user's confirmation that no library exists; not re-asked this pass |
| Code library | live | Detached worktree of `origin/main` at 136030d; ran install, build, lint, format check, and all tests |
| Published packages | live | Installed the npm packages into an empty project and ran them in Chromium |
| Docs | live | Built the site, read `dist`, and fetched the deployed site and Storybook |
| Process | live | `gh` for issues, PRs, runs, branch protection, and tags; npm registry and downloads API |
| Agent surface | live | Called the local MCP, the hosted MCP over HTTP, and the installed CLI |
| Benchmark | live | Design-systems knowledge MCP (`search_design_knowledge`) |

## Known symptoms
- #245 dark `border.subtle` is 1.06:1 on `background.surface`, open since 2026-10-22
- #261 no repeatable eval of whether the spec tools help agents build UI

## Probable greens
- Token contrast audits, tests that assert behavior, spec-to-implementation mapping, agent access

## Intentional deviations
- No design library: the spec is the contract
- No component token tier; components read semantic tokens and may read spacing and motion primitives (`packages/tokens/docs/adr/0003`)
- No per-component docs pages: the spec serves agents, Storybook is the workbench, and the docs are orientation plus one catalog (ADR 0007)
- Accordion chevron uses physical borders so it points the same way in RTL
- No PR reviews on a solo project
- Slider has a spec and a React build but no web component (React is the second implementation)

## Scope & frame
- Stations this pass: all 10 · Scoring frame: solo maintainer, 0.x, few consumers
- Out of scope: consumer product repos (not reachable), manual screen reader runs
