---
name: verify
description: Check that a change to the Taproot design system works before committing it - run the checks for what changed, then open the running component, docs page, or MCP server and look. Use before committing any change to a component, the spec, tokens, Storybook, the docs site, or the MCP server, or when asked to verify, smoke test, or check a change.
---

# Verify a change

Passing tests are not the whole check. Run the checks for what changed, then see the change work
in the running app. Report what you ran and what you saw, with a screenshot for anything visual.

## 1. Run the checks for what changed

Cheap checks first. From the repository root:

```bash
pnpm lint
pnpm format:check
pnpm component:status --changed
```

`component:status --changed` finds each component the branch or working tree touches and checks
it: files, spec validation, and which MUST rules no test cites. Then run the tests of each package
you changed, with its workspace dependencies built:

```bash
pnpm exec turbo run test --filter=@taproot-ds/web-components
```

| You changed                               | Filter                                                |
| ----------------------------------------- | ----------------------------------------------------- |
| `packages/components`                     | `@taproot-ds/web-components`                          |
| `packages/react`                          | `@taproot-ds/react-components`                        |
| `packages/spec` (content or tooling)      | `@taproot-ds/spec`, then `@taproot-ds/web-components` |
| `packages/tokens`                         | `@taproot-ds/tokens`, then the component packages     |
| `apps/documentation`                      | `documentation`                                       |

A web component's look is also checked by screenshots, in CI only:
`pnpm --filter @taproot-ds/web-components test:visual`.

## 2. Review against the rules

For each changed component, read its MUST rules and check the change against each one:

```bash
node packages/spec/bin/taproot.js rules <name> --level must
```

Cite each rule you checked by its address, such as `component.button#label-describes-result`.

## 3. See it run

Start the app with the preview tools, by the names in `.claude/launch.json`:

| Changed                       | Server          | Where to look                                                |
| ----------------------------- | --------------- | ------------------------------------------------------------ |
| A web component or its tokens | `storybook`     | `/?path=/story/components-<name>--<story>`, light and dark   |
| The docs site                 | `documentation` | The changed page, and `/components` for the catalog          |
| The MCP server or the spec    | `mcp`           | Call a tool on `http://localhost:8787/mcp`, read the answer  |
| The CLI                       | none            | `node packages/spec/bin/taproot.js get <name>`               |

In Storybook, switch the theme from the toolbar, use the component by keyboard (Tab, Space,
Enter, arrows), and check focus is visible. Read the console for errors. The React components have
no Storybook; their browser tests are the check.

## 4. When a check fails

Fix the cause and run the check again. After three rounds on the same failure, stop and tell the
user what fails and what you tried.

Never make a check pass by weakening it: no skipped tests, added sleeps, reruns until green,
loosened assertions, or new entries in `untested-rules.json`. A flaky test is a bug. If you cannot
find its cause, say so and leave the decision to the user.
