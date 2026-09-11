---
name: verify-design-system
description: Verify the Ember & Sage design system through its Blume documentation UI, token build gates, and web-component tests. Use after changing tokens, labs, documentation, theming, or components, and whenever user-visible proof is required.
---

# Verify the design system

Drive the Blume documentation site as the primary user surface. The published token and component packages are secondary surfaces and have their own build and browser-test gates.

Read `features/README.md`, then the relevant feature file before choosing proof. Do not claim a feature is verified through a different entry point than the map requires.

## Launch

From the repository root, install dependencies and build once:

```bash
pnpm install
pnpm build
```

Choose a unique run ID and unused port so concurrent agents do not share an instance:

```bash
RUN_ID="verify-$(date +%Y%m%d-%H%M%S)"
PORT=4321
node .cursor/skills/verify-design-system/scripts/control.mjs launch "$RUN_ID" "$PORT"
```

The helper starts `pnpm --filter documentation dev --host 127.0.0.1 --port <port>` in an owned process group after `pnpm build`. Readiness requires HTTP success and the `Design System` page identity. It writes instance metadata and server logs beneath `.cursor/verification-runs/<run-id>/`.

Teardown only the instance belonging to this run:

```bash
node .cursor/skills/verify-design-system/scripts/control.mjs cleanup "$RUN_ID" "$PORT"
```

Never kill by process name. The component demo's `pnpm exec turbo run dev --filter=@stevegreco/design-system-components` uses fixed port 4500 and is not safe for parallel verification.

## Doctor

Run this first whenever launch, routing, or browser behavior looks wrong:

```bash
node .cursor/skills/verify-design-system/scripts/control.mjs doctor "$RUN_ID" "$PORT"
```

Doctor is read-only. It requires the recorded process to be alive, the requested port to match its metadata, HTTP to succeed, and the response to identify the Design System site. Refuse to drive an unowned process or a port whose metadata does not match.

## Drive

Use the shipped Playwright helper for the mapped border-lab path:

```bash
node .cursor/skills/verify-design-system/scripts/control.mjs border "$RUN_ID" "$PORT"
```

This opens `/labs/border`, finds the lab by `aria-label="Semantic border lab"`, records the initial thick state, selects `Thin · 1px`, and requires:

- `[data-border-stage]` changes from `data-border-size="thick"` to `"thin"`.
- The thin control changes to `aria-pressed="true"`.
- The thick control changes to `aria-pressed="false"`.

For other mapped documentation features, use Playwright with the exact routes and stable ARIA or `data-*` handles in their feature files. Avoid coordinates, tab order, generated classes, and fixed sleeps.

Package gates:

```bash
pnpm build
pnpm exec turbo run test --filter=@stevegreco/design-system
pnpm exec turbo run test --filter=@stevegreco/design-system-components
pnpm exec turbo run test --filter=@stevegreco/design-system-knowledge
pnpm exec turbo run test --filter=documentation
pnpm --filter documentation exec blume validate --strict
pnpm --filter documentation exec blume check --isolated
```

If Chromium is absent, install the browser binary with `pnpm exec playwright install chromium`, then rerun the component or UI check. No environment variables, auth, database, seed data, or backend are required.

## Evidence

Keep proof in `.cursor/verification-runs/<run-id>/<feature>/`. The border helper preserves:

- `before.png` and `before.aria.yml` for the state before the action.
- `after.png` and `after.aria.yml` for the resulting state.
- `result.json` with the route, action, before/after attributes, and assertion result.
- `server.log` and `instance.json` for launch identity.

Proof must exercise the real user path. Capture the action and resulting state, not only a final screenshot. For token or component changes, pair visible UI proof with the relevant build, audit, or browser-test exit status. Do not substitute internal state setters or test-only routes. External systems are not involved, so mocks are unnecessary.

## Cleanup

Always run cleanup after success and after each failed attempt:

```bash
node .cursor/skills/verify-design-system/scripts/control.mjs cleanup "$RUN_ID" "$PORT"
```

Cleanup signals only the process group recorded for the run. It retains all metadata, logs, screenshots, snapshots, and results beneath `.cursor/verification-runs/<run-id>/`.

After cleanup, confirm proof remains:

```bash
test -f ".cursor/verification-runs/$RUN_ID/border-lab/result.json"
```

## Helpers

`scripts/control.mjs` is the executable control surface:

```text
control.mjs launch  <run-id> [port]
control.mjs doctor  <run-id> [port]
control.mjs border  <run-id> [port]
control.mjs cleanup <run-id> [port]
```

Run it with `node` from the repository root. It depends on the root `playwright` development dependency and creates no application data.
