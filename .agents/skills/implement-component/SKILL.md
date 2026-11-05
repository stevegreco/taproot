---
name: implement-component
description: Build a component of the Taproot design system from its draft spec. Completes the spec contract (parameters, rules, tokens, rationale), writes the failing tests, the hand-written web component in packages/components, the web API file in packages/components/implementation, and the Storybook stories. Use when asked to implement or build a component that has a draft spec, when finishing a partly built component, or when reviewing an implementation PR. The second of two phases, after spec-component.
---

# Implement a component

The second of two phases, one commit each in a single pull request:

1. **spec-component**: a draft spec that says what the component is for.
2. **implement-component** (this skill): completes the spec and builds the web component.

Start on the component's branch, after its draft commit is reviewed. If there is no draft, run
spec-component first.

```bash
node packages/spec/bin/taproot.js get component.<name>
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

The component inherits the rules of each pattern and guideline in its `links.follows`. Do not
restate them. Write only what is true of this component, and change an inherited rule on purpose:

- To narrow it, repeat its `id` with `extends: <address>` and a `statement` for this component,
  such as what its value is for `form-value`.
- To set it aside, repeat its `id` with `waived: <reason>`, such as a rule about an option the
  component does not have.

`node packages/spec/bin/taproot.js rules --id component.<name>` lists the full set to build and test
against.

`tokens` maps each anatomy part to conditions (`base`, `variant.primary`, `hover`,
`variant.primary + hover`) and each condition to properties and token references.

Check: `node packages/spec/bin/taproot.js validate`.

## 2. Scaffold the files and write the failing tests

```bash
pnpm component:new <name> --phase implementation
```

This reads the spec and writes every file this phase needs, with `TODO` comments where the work
goes: `src/<name>.js` (property accessors from the parameters, an empty shadow root), `.css`,
`.d.ts`, `test/<name>.test.js`, `implementation/<name>.md` (an `api` row per parameter and event),
`stories/<name>.stories.js`, and the host-checks row `test/host-checks/<name>.js`. It never
overwrites a file that exists. Do not edit `src/index.js` or `src/index.d.ts`: the build generates
them from `src/`.

The test file has one failing test per MUST rule, inherited ones included, named
`[rule-id] <statement>`. Before any runtime
code, replace each `expect.fail` with a test that proves the rule. Rename a test to say what it
checks, keeping the ID first, or tag a test that proves several rules `"[a] [b] …"`. Run them and
watch every one fail for the right reason.
A test that passes before the runtime exists proves nothing. For role, name, or hidden state, use
`exposedNodes()` from `test/helpers/accessibility.js` (see the gotchas).

## 3. Write the runtime

In `packages/components`, fill in the scaffold:

- `src/<name>.js` and `src/<name>.css`: render the parts and their behavior. Use
  `./internal/element.js` (`Base`, `ForwardsFocus`, `focusTarget`, `lazyStyleSheet`,
  `defineElement`). CSS uses the tokens the spec maps.
- `src/<name>.d.ts`: add doc comments, and anything the accessors do not cover.

## 4. Finish the tests

- `test/<name>.test.js`: this component's behavior only. Add tests for SHOULD rules and anything
  else the runtime does. Every test from step 2 now passes.
- The row in `test/host-checks/<name>.js`. Fix its `TODO`s: `focusPart`, and `parts`, which start
  as the spec's anatomy names. The shared checks cover alias registration, `hidden`, parts, the
  required slot, focus forwarding, visible focus, events while disabled, keyboard activation,
  `form`, enum properties, and properties set before registration.

`test/package-root.test.js` and `packages/spec/test/content.test.js` find components and records
on disk, so they need no edits. The tooling checks that the API mapping covers the spec, but nothing
checks behavior or styling against it. When you change one, read the other.

Check: `pnpm exec turbo run test --filter=@taproot-ds/web-components`.

## 5. Map the web API and add stories

- `packages/components/implementation/<name>.md`: replace the `usage` placeholder, and add `api`
  rows for anything the scaffold could not derive, such as extra properties. When the spec has
  `parts`, add a `parts` block with each part's `api` rows, as `implementation/card.md` does, and a
  `tagName` only when the part is its own child element. When the spec has `items`, add an `items`
  block that names each item's child element and gives its own `api` rows, as
  `implementation/accordion.md` does. The check fails until every part and item parameter has a row. The body is
  web-specific guidance only, in the scaffold's sections: Slots, The hidden attribute, Framework
  notes, and Styles, which every file keeps as written.
  Behavior is in the spec's rules, so cite a rule by address (`component.<name>#<rule-id>`) rather
  than restating it. `implementation/alert.md` is the example. This file gives the component its row in
  the docs catalog and serves `node packages/spec/bin/taproot.js get component.<name> --impl web`.
- `apps/storybook/stories/<name>.stories.js`: the scaffold has a control for every parameter. Add
  one story per notable state, as `stories/checkbox.stories.js` does. Check that the Accessibility panel reports no
  violations in both themes: `pnpm exec turbo run dev --filter=storybook`.

## 6. Ship it

- Remove `status: draft` from the spec. The spec tests fail when a draft has an implementation
  file.
- Point the neighbors at it. Search for records whose `avoid` entries describe this component in
  plain text, such as "an inline status message", and set their `instead` to `component.<name>`:

  ```bash
  node packages/spec/bin/taproot.js search "<what the component does>"
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
Ask for review. The pull request merges after this commit is reviewed. The section lists:

- Public API decisions.
- Each checklist item that is not in the spec, with its `rationale` decision.
- Each MUST rule the status script lists without a test, and why.
- Check results.
