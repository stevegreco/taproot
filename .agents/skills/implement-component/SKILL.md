---
name: implement-component
description: Build a component of the Ember & Sage design system from its draft spec. Completes the spec contract (parameters, rules, tokens, rationale), writes the failing tests, the hand-written web component in packages/components, the web API file in apps/documentation/implementation, and the Storybook stories. Use when asked to implement or build a component that has a draft spec, when finishing a partly built component, or when reviewing an implementation PR. The second of three phases, after spec-component and before document-component.
---

# Implement a component

The second of three phases, one commit each in a single pull request:

1. **spec-component**: a draft spec that says what the component is for.
2. **implement-component** (this skill): completes the spec and builds the web component.
3. **document-component**: the docs example and its Verify steps.

Start on the component's branch, after its draft commit is reviewed. If there is no draft, run
spec-component first.

```bash
pnpm spec get component.<name>
```

Design system facts go in the spec, never only in code or this skill (see `AGENTS.md`). Read
[references/gotchas.md](references/gotchas.md) before starting, and again whenever a check fails.

Pick a reference component and copy its shape:

- **Link**: small, non-form, one inner control, a placement variant.
- **Checkbox**: form-associated, boolean states, label/hint/error in the shadow root.
  Text field is the older version of the same shape.
- **Badge**: non-interactive, variants only.

## 1. Complete the spec contract

The draft has purpose, usage, and anatomy. Add the rest to the same record:
`parameters`, `events`, `states`, `preferences`, `rules` (each with a stable `id`, a `level`, and a
`topic`), `accessibility`, `tokens`, and `rationale`. Check the draft's pull request for open
questions.

Decide each item on the "decide what it ships" checklist on purpose. Run the status script to see
them, with the question each one answers:

```bash
pnpm component:status <name> --phase implementation
```

Each item ends up as a parameter, state, token condition, or rule, or as a `rationale` entry saying
why the component does not have it. Give that entry `covers` with the item names it settles, such
as `covers: [loading, invalid]`. One entry can cover several items. Ask the user only about
decisions that change public API.

`tokens` maps each anatomy part to conditions (`base`, `variant.primary`, `hover`,
`variant.primary + hover`) and each condition to properties and token references.

Check: `pnpm spec validate`.

## 2. Write the failing tests

Before any runtime code, list the MUST rules and write one test per rule in
`packages/components/test/<name>.test.js`:

```bash
pnpm spec rules --id component.<name> --level must
```

Start each test name with the IDs of the rules it proves, such as
`"[square-box] scales slotted artwork to fill the square"`. Run them and watch every one fail.
A test that passes before the runtime exists proves nothing. For role, name, or hidden state, use
`exposedNodes()` from `test/helpers/accessibility.js` (see the gotchas).

## 3. Write the runtime

By hand, in `packages/components`:

- `src/<name>.js` and `src/<name>.css`. Use `./internal/element.js` (`Base`, `ForwardsFocus`,
  `focusTarget`, `lazyStyleSheet`, `defineElement`). CSS uses the tokens the spec maps.
- `src/<name>.d.ts`: the element class, attribute types for JSX, and `HTMLElementTagNameMap`.
- Entries in `src/index.js` (import, export, and call the define helper) and `src/index.d.ts`
  (import, re-export, and the JSX attributes map).

## 4. Finish the tests

- `test/<name>.test.js`: this component's behavior only. Add tests for SHOULD rules and anything
  else the runtime does. Every test from step 2 now passes.
- A row in the table in `test/host-checks.test.js`. The shared checks cover alias registration,
  `hidden`, parts, the required slot, focus forwarding, visible focus, events while disabled,
  keyboard activation, `form`, enum properties, and properties set before registration. The test
  fails if a component in `src/` has no row.

`test/package-root.test.js` and `packages/spec/test/content.test.js` find components and records
on disk, so they need no edits. Nothing checks the implementation against the spec. When you
change one, read the other.

Check: `pnpm exec turbo run test --filter=@stevegreco/design-system-components`.

## 5. Map the web API and add stories

- `apps/documentation/implementation/<name>.md`: front matter with `component`, `package`,
  `tagName`, `defineExport`, `usage`, and `api` rows that map web attributes, properties, and
  events to spec parameters and events. The body is web-specific guidance only: slots, the `hidden`
  attribute, framework notes. Behavior is in the spec's rules, so cite them rather than restating
  them. Copy `implementation/button.md`. This file gives the component its docs page and serves
  `pnpm spec get component.<name> --impl web`.
- `apps/storybook/stories/<name>.stories.js`: a control for every attribute and one story per
  notable state. Copy `stories/checkbox.stories.js`. Check that the Accessibility panel reports no
  violations in both themes: `pnpm exec turbo run dev --filter=storybook`.

## 6. Ship it

- Remove `status: draft` from the spec. The docs tests fail when a draft has an implementation
  file.
- Point the neighbors at it. Search for records whose `avoid` entries describe this component in
  plain text, such as "an inline status message", and set their `instead` to `component.<name>`:

  ```bash
  pnpm spec search "<what the component does>"
  ```

## 7. Confirm completeness

```bash
pnpm component:status <name> --phase implementation
```

It exits 1 when a required file or entry is missing, and shows where each checklist item is
decided and which MUST rules have no tagged test. A `warn` row does not fail: for a checklist
item, add the decision or a `rationale` entry with `covers`; for a rule, add a test or say in the
pull request why it has none.

Then run the repo gates from the root: `pnpm build`, `pnpm test`, `pnpm lint`,
`pnpm format:check`.

## Pull request

Commit on the same branch and add an "Implementation" section to the pull request description.
Ask for review and stop before the docs commit. The section lists:

- Public API decisions.
- Each checklist item that is not in the spec, with its `rationale` decision.
- Each MUST rule the status script lists without a test, and why.
- Check results.

The docs example and Verify steps are the next phase: document-component.
