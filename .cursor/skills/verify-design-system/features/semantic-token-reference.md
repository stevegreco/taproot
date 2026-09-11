# Semantic token reference

The semantic token reference groups intent-based color, typography, elevation, and shape contracts and links each group to its visual lab.

## Sub-features

- `semantic-guidance` explains role-first token selection.
- `semantic-groups` renders background, foreground, border, typography, elevation, and shape references.
- `status-pairings` shows compatible status background, foreground, and border contracts.
- `semantic-lab-links` reaches each matching visual lab.

## How to get to it (user POV)

- Open `/design-tokens/semantic`.
- Follow Design Tokens navigation from `/design-tokens/overview`.
- Follow a lab link within a semantic group.

## Driving it with Playwright

Preconditions:

- Doctor passes for the run-owned documentation URL.
- `pnpm exec turbo run test --filter=documentation` and `pnpm --filter documentation exec blume validate --strict` pass.

- **Open reference.** Navigate to `/design-tokens/semantic`. Require the `Semantic Tokens` heading and the `Choose a semantic token` instructions.
- **Inspect groups.** Require `.semantic-reference` regions or `.semantic-reference__row` entries beneath color, typography, elevation, and shape sections.
- **Inspect status contracts.** Require the `Supported status pairings` section to identify background, foreground, and border roles.
- **Follow a lab.** Select the `Explore background roles in the lab` link. Require navigation to `/labs/background` and `[aria-label="Semantic background lab"]`.
- **Proof.** Capture the grouped reference and the resulting background-lab screen. Pair it with semantic-reference test and strict-link validation output.

## Gotchas

- Reference markup is generated from shared TypeScript data, while the page's prose is MDX.
- A successful page render does not replace the semantic-reference structure test.
- Blume emits Markdown and MDX mirrors during build; browser verification must use the HTML route.
- Validate each lab link you claim; one successful link does not prove all six.
