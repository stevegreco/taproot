---
name: create-component
description: Add a new web component to the Ember & Sage design system (a technology-neutral spec in packages/spec, the hand-written runtime and tests in packages/components, and the docs implementation file, example, and Verify steps in apps/documentation). Use when asked to build, add, or scaffold a component such as Icon, Checkbox, Field, Radio, or Switch, when finishing a partly built component, or when reviewing a component PR for completeness.
---

# Create a component

A component has two halves. The spec says what it is and how it behaves, without naming any
technology. The implementation builds it for the web. Design system facts go in the spec, never
only here (see `AGENTS.md`).

Pick a reference component and copy its shape:

- **Link**: small, non-form, one inner control, a placement variant.
- **Checkbox**: form-associated, boolean states, label/hint/error in the shadow root.
  Text field is the older version of the same shape.
- **Badge**: non-interactive, variants only.

Read [references/gotchas.md](references/gotchas.md) before starting, and again whenever a check
fails.

## Workflow

### 1. Confirm the need

```bash
pnpm spec get guideline.compose-or-propose
```

Compose existing components where you can. Propose a new one only when the guideline says so.

### 2. Decide what it ships

Decide each item on purpose. Each ends up as a parameter, state, token condition, or rule in the
spec, or as a `rationale` entry saying why the component does not have it. One entry can cover
several items. Ask the user only about decisions that change public API.

| Item | Question to answer |
| --- | --- |
| Disabled | Can it be unavailable? Is it focusable, and is the reason shown? |
| Visited, selected, or checked | Does it have a persistent on/off or visited state? |
| Loading | Can it wait on work? Does it block activation while it does? |
| Invalid | Can its value be wrong? What message says so? |
| Sizes | More than one size, or a placement variant? |
| Density | Does it change in compact layouts, or does the layout handle that? |
| Icon-only | Can it render without text? Where does its accessible name come from? |
| Right-to-left | Does anything mirror when the direction is right-to-left? |
| Reduced motion | Does it animate? What happens when the user prefers reduced motion? |
| High contrast and forced colors | Does every state stay visible without color alone? |

Link is the reference for a small component. Its rationale records no disabled state ("a link with
no destination is text"), no visited styling, and placement as a variant rather than a size.

### 3. Write the spec

`packages/spec/content/components/<name>/<name>.spec.yaml`, copied from Checkbox so it keeps
the `# yaml-language-server: $schema=...` header, which gives completion and inline errors. The
format is in `packages/spec/SPEC.md`.

- Technology-neutral. No element, attribute, slot, framework, or CSS names, and no code.
- `id`, `title`, `summary`, `description`, `usage` (with `avoid` entries whose `instead` is a
  record ID where one exists), `anatomy`, `parameters`, `events`, `states`, `preferences`, `rules`
  (each with a stable `id`, a `level`, and a `topic`), `accessibility`, `tokens`, and `rationale`.
- `tokens` maps each anatomy part to conditions (`base`, `variant.primary`, `hover`,
  `variant.primary + hover`) and each condition to properties and token references.
- Link the component to the patterns and guidelines that apply.

Check: `pnpm spec validate`.

### 4. Write the runtime

By hand, in `packages/components`:

- `src/<name>.js` and `src/<name>.css`. Use `./internal/element.js` (`Base`, `ForwardsFocus`,
  `focusTarget`, `lazyStyleSheet`, `defineElement`). CSS uses the tokens the spec maps.
- `src/<name>.d.ts`: the element class, attribute types for JSX, and `HTMLElementTagNameMap`.
- Entries in `src/index.js` (import, export, and call the define helper) and `src/index.d.ts`
  (import, re-export, and the JSX attributes map).

### 5. Test it

- `test/<name>.test.js`: this component's behavior only.
- A row in the table in `test/host-checks.test.js`. The shared checks cover alias registration,
  `hidden`, parts, the required slot, focus forwarding, visible focus, events while disabled,
  keyboard activation, `form`, enum properties, and properties set before registration.
- A row in `test/package-root.test.js`.

Nothing checks the implementation against the spec. When you change one, read the other.

Check: `pnpm exec turbo run test --filter=@stevegreco/design-system-components`.

### 6. Document and verify

In `apps/documentation`:

- `implementation/<name>.md`: front matter with `component`, `package`, `tagName`,
  `defineExport`, `usage`, and `api` rows that map web attributes, properties, and events to spec
  parameters and events. The body is web-specific guidance. Copy `implementation/button.md`.
- `examples/<name>.tsx`: one realistic demo with `data-<name>-*` handles and the standard
  `Verify:` header.
- `examples/<name>.verify.js`: named steps that exercise the demo the way a person would.
- `docs/components/<name>.mdx` (optional): preview prose only. Do not restate the spec.

Check: `pnpm exec turbo run test --filter=documentation`.

In `apps/storybook`, add `stories/<name>.stories.js`: a control for every attribute and one story
per notable state. Copy `stories/checkbox.stories.js`. Check that the Accessibility panel reports no
violations in both themes: `pnpm exec turbo run dev --filter=storybook`.

### 7. Confirm completeness

```bash
node .agents/skills/create-component/scripts/status.mjs <name>
```

It exits 1 when a file or entry is missing and shows where each item in step 2 is decided. A
`warn` row means no keyword match: read the spec and either add the decision or confirm an
existing entry covers it.

Then run the repo gates from the root: `pnpm build`, `pnpm test`, `pnpm lint`,
`pnpm format:check`.

## Pull request

Base on `main` and never stack. The description lists:

- Each item from step 2 that is not in the spec, with its `rationale` decision.
- Check results, including what the example's Verify steps prove.
