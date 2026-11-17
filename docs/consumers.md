# Consumers

Who uses Taproot, which versions they pin, and what they want next. Inspections score adoption
and feedback (Stations 1 and 8) from this page, and the component backlog is ranked from it. Update
it when a product starts or stops using a package.

Last checked: 2026-11-12.

## Products

Taproot has one consumer: its maintainer, Steve Greco. No product outside this repository depends
on a published package. The npm download counts are release and tooling activity, not other teams.

| Product | Packages | Version | Wants next |
| --- | --- | --- | --- |
| The maintainer's own projects | `@taproot-ds/tokens`, `@taproot-ds/web-components`, `@taproot-ds/spec` | Latest | Decided by the maintainer, in the issue tracker |

## Inside this repository

These apps use the packages from the workspace, so they always run the current source.

| App | Packages |
| --- | --- |
| `apps/documentation` | spec, tokens, web-components |
| `apps/mcp` | spec, tokens, web-components |
| `apps/storybook` | tokens, web-components |
| `apps/cli-explorer` | tokens |
| `apps/videos` | tokens, web-components |

## What this means

- Every `feedback` issue is the maintainer's own. No outside requests are waiting.
- The order of new components follows the maintainer's needs and how often other design systems
  ship them, not consumer requests.
- When a second consumer appears, add a row and ask what it wants next.
