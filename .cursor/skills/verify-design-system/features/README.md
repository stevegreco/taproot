# Design system verification map

This directory is the maintained source for verifying the user-facing behavior of the Ember & Sage design system. Read this index before driving the Blume documentation site, then use the matching feature recipe.

## Baseline preconditions

- Run commands from the repository root with Node 22.12 or newer and pnpm.
- Complete `pnpm install` and `pnpm build`.
- Launch documentation with a unique run ID and unused port through `scripts/control.mjs`.
- Run `control.mjs doctor` and require the recorded process, URL, HTTP response, and Design System page identity to agree.
- Never drive an instance that was not started by the current verification run.
- Install Chromium with `pnpm exec playwright install chromium` if Playwright reports that its executable is missing.

## Driving conventions

- Start each recipe from its documented route and preconditions.
- Prefer accessible names, custom elements, and project-owned `data-*` attributes over generated classes or DOM position.
- Wait for a visible user state or changed attribute, not a fixed delay.
- Use a fresh browser context when theme, clipboard, or local-storage state could leak between recipes.
- Use the same run directory for launch logs and feature evidence.

## Proof and skip reporting

- Capture both the user action and resulting state.
- UI proof includes before/after screenshots and ARIA snapshots with the page identity visible.
- Token and component proof pairs UI evidence with the relevant build, audit, or browser-test result.
- Record the feature ID, route, action, and observed attributes in a machine-readable result.
- Report an unreachable entry point with the attempted route or command and unmet precondition.
- Do not report an untested entry point as covered through another route.
- Cleanup must retain evidence.

## Feature entry contract

Each feature file names user-visible behavior and uses exactly four H2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it with Playwright`, and `Gotchas`.

## Features

- [Token theming](./token-theming.md) covers semantic token consumption and light/dark theme behavior.
- [Interactive labs](./interactive-labs.md) covers the six visual labs and the border-width interaction.
- [Primitive color guide](./primitive-color-guide.md) covers palette browsing and copy feedback.
- [Semantic token reference](./semantic-token-reference.md) covers grouped intent-based token tables and lab links.
- [Web components](./web-components.md) covers Button and Badge previews plus package browser tests.
