# Consumers

Who uses Taproot, which versions they pin, and what they want next. Inspections score adoption
and feedback (Stations 1 and 8) from this page, and the component backlog is ranked from it. Update
it when a product starts or stops using a package.

Last checked: 2026-11-19.

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

## Component backlog

Missing components, in the order they will be specified. With one consumer, the order follows the
maintainer's needs and how many reference systems ship each one (the 2026-11-04 inspection checked
five). Ranked 2026-11-19, for issue #313.

| Rank | Component | Why here |
| --- | --- | --- |
| 1 | Table | All five reference systems ship one. Nothing in Taproot shows rows of records to compare. |
| 2 | Menu | Four of five ship one. Overflow and per-item actions have no home: Select stores a value and Tooltip only names a control. |
| 3 | Toast | Four of five ship one. Alert covers status in the flow of the page, not a brief message after an action. |
| 4 | Pagination | Four of five ship one. It matters once Table exists. |
| 5 | Popover | Four of five ship one. Menu and Combobox open the same kind of overlay, so it may come out of their work. |
| 6 | Combobox | Select cannot filter a long list or take free text. |
| 7 | Breadcrumb | Small, and Link covers each step until a site has deep hierarchies. |
| 8 | Navigation | Product layout composed from Link covers it for now. |
| 9 | Date picker | Text field with a date hint covers it for now. Large, and needs Popover. |
| 10 | Empty state and skeleton | Composed from text, Button, and tokens for now. |

Button's loading state is a change to an existing component, not a new one, and is tracked apart
from this list.
