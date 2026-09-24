---
name: create-component
description: Add a new web component to the Ember & Sage design system (packages/knowledge spec and binding, packages/components runtime and tests, apps/documentation page, example, and Verify steps). Use when asked to build, add, or scaffold a component such as Icon, Checkbox, Field, Radio, or Switch, when finishing a partly built component, or when reviewing a component PR for completeness.
---

# Create a component

The definition of done is `docs/knowledge/new-component.md`. Read it first. This skill is the
procedure for meeting it and the traps that cost time before. Design system facts go in the
knowledge records, never only here (see `AGENTS.md`).

Pick a reference component and copy its shape:

- **Link**: small, non-form, one inner control, a placement variant.
- **Checkbox**: form-associated, boolean states, label/hint/error in the shadow root, suppressed
  states. Text field is the older version of the same shape.
- **Badge**: non-interactive, variants only.

Read [references/gotchas.md](references/gotchas.md) before writing the spec, and again whenever
a check fails.

## Workflow

Work in this order. Each step's check must pass before the next, because later checks read the
compiled records.

### 1. Decide what it ships

Answer every item on the checklist in `docs/knowledge/new-component.md` (disabled, checked,
loading, invalid, sizes, density, icon-only, RTL, reduced motion, forced colors). Each becomes a
parameter, state, visual, or rule in the contract, or a `rationale` entry saying why not. Ask the
user only about decisions that change public API. Decide the rest and record them.

### 2. Author the records

- `packages/knowledge/content/components/<slug>/<slug>.spec.yaml`: contract with `usage`,
  `content`, `anatomy`, `parameters`, `events`, `states`, `behavior`,
  `accessibility.requirements`, `rationale`, `stateResolution`, and `visuals`. Give every rule a
  stable ID and level.
- `packages/knowledge/content/bindings/<slug>.web-component.md`: tag, registration, anatomy
  element and part per anatomy name, events, `properties`, `formAssociation` if it is a form
  control, and `focus.forwardsTo`. Add `parameters` and `parts` entries only for exceptions (see
  gotchas).
- If a pattern should guide its variants, add the component to the pattern's `relations.guides`
  and `variantGuidance`.

Check: `pnpm exec turbo run build --filter=@stevegreco/design-system-knowledge`.

### 3. Write the runtime

`packages/components/src/<slug>.{js,css,d.ts}`. Use `./internal/element.js` (`Base`,
`ForwardsFocus`, `focusTarget`, `lazyStyleSheet`, `defineElement`). The file holds only this
component's behavior. CSS uses only the tokens the spec maps. Put pseudo-classes on the inner
control named by `focus.forwardsTo`.

The build writes the package-root barrel, `src/index.js` and `src/index.d.ts`, from the bindings.
Do not edit them; commit what the build writes. Add the glue. These are the only lists a
component edits:

- `apps/documentation/examples/custom-elements.d.ts`: JSX attributes type and `IntrinsicElements`
  entry.
- `test/upgrade.test.js`: one "reach <Name>" case.
- `apps/documentation/docs/components/meta.ts`: nav order (optional).

### 4. Prove the contract

- `packages/components/test/<slug>.test.js`. Tag each test covering a rule:
  `test("[rule-id] …")`. A `must` rule that no test can prove (authored wording, consumer
  responsibility) gets a reason in `test/unautomated-rules.js` instead.
- The mapping, census, and element-type checks run on their own from the records. Do not edit
  them for one component. If one fails, fix the spec, CSS, or types. Extend the harness
  (`test/commands/contract-cases.js`) only when a new kind of state or axis appears, and make the
  extension generic.

Check: `pnpm exec turbo run test --filter=@stevegreco/design-system-components`.

### 5. Document and verify

- `apps/documentation/docs/components/<slug>.mdx`: follow `link.mdx`. Sections come from
  `<ComponentKnowledge component="<slug>" section="…" />`. Do not restate the contract in prose.
- `apps/documentation/examples/<slug>.tsx`: one realistic demo with `data-<slug>-*` handles and
  the standard `Verify:` header.
- `apps/documentation/examples/<slug>.verify.js`: named steps that exercise the demo the way a
  person would.

Check: `pnpm exec turbo run test --filter=documentation`.

### 6. Confirm completeness

```bash
node .agents/skills/create-component/scripts/status.mjs <slug>
```

It exits 1 when a file or glue entry is missing, and lists where each checklist item is decided.
A `warn` row on the checklist means no keyword match: read the spec and either add the decision
or confirm an existing entry covers it.

Then run the repo gates from the root: `pnpm build`, `pnpm test`, `pnpm lint`,
`pnpm format:check`.

## Pull request

Base on `main` and never stack. The description lists:

- Each checklist item not in the contract, with its `rationale` decision.
- Any `unautomated-rules.js` entries and why.
- Any harness change (contract cases, drivers, fixtures) and why it is generic.
- Check results, including what the example's Verify steps prove.
