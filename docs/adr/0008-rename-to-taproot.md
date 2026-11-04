# ADR 0008: Rename to Taproot

**Status:** Accepted

## Context

The system was called Ember & Sage, while its packages and repository used a generic
`design-system` name under a personal npm scope. The tokens package was named
`@stevegreco/design-system`, which did not say what it held.

## Decision

**The system is named Taproot.** The name replaces Ember & Sage everywhere that is still in use.

| Thing                  | Before                           | After                          |
| ---------------------- | -------------------------------- | ------------------------------ |
| Tokens package         | `@stevegreco/design-system`      | `@taproot-ds/tokens`           |
| Web components package | `@stevegreco/web-components`     | `@taproot-ds/web-components`   |
| Spec package           | `@stevegreco/design-system-spec` | `@taproot-ds/spec`             |
| React package          | `@stevegreco/react-components`   | `@taproot-ds/react-components` |
| CLI                    | `ds-spec`, `ds-spec-mcp`         | `taproot`, `taproot-mcp`       |
| MCP server             | `design-system-spec`             | `taproot`                      |
| Repository             | `stevegreco/design-system`       | `stevegreco/taproot`           |

**The `ds` prefix stays.** CSS variables (`--ds-*`), element tags (`<ds-*>`), and class names
(`Ds*`) keep it. The prefix is neutral, and changing it would break every consumer's markup and CSS
for no functional gain.

**History stays as written.** Earlier ADRs, research, and changelogs keep the names they used.

## Consequences

- The new packages are new to npm, so their first versions are published by hand. npm cannot set up
  trusted publishing for a package that does not exist yet.
- Consumers change their package names, imports, CLI commands, and local MCP configuration. Their
  markup and CSS do not change. The old packages are deprecated and point to the new names.
- Another company, Taproot IO, sells a web component design system called Espalier, so searches for
  the name can return its results.
