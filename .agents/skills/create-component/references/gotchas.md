# Gotchas

Grouped by the file you are in.

## Contents

- Spec
- Runtime
- Component tests
- Docs implementation file
- Docs example and Verify steps
- Types
- Commands

## Spec

- The spec is technology-neutral. If you want to write a tag name, attribute, slot, or CSS
  property, it belongs in `apps/documentation/implementation/<name>.md` or the runtime instead.
- `states` is an unordered list. Nothing computes a combined style. If a combination needs its own
  tokens, write it as its own condition joined with ` + ` (`variant.primary + hover`), or explain
  in `rationale` why it is not styled.
- A token condition must name `base`, a declared state, a value of a declared enum or boolean
  parameter, or a declared preference value. Every `tokens` part must be an anatomy part.
- Property names are neutral: `focus-ring`, `padding-horizontal`, `padding-vertical`, `motion`,
  `motion-duration`, `motion-easing`. Token references are opaque strings.
- Geometry and layout are not token properties. State them as rules or rationale.
- Prefer semantic tokens (tokens ADR 0003). Use a primitive only when no semantic role fits, and
  say why in `rationale`.
- A rule ID is unique within its record and must not equal a top-level field name. Its address is
  `component.<name>#<rule-id>`.
- An `avoid[].instead` that is a record ID creates an `alternative` link and must resolve. Plain
  text is allowed for a component that does not exist yet.
- Links and references may target a section: a heading slug, a rule ID, or a field path such as
  `parameters.variant.danger`. A missing target is a validation error.
- A boolean that is also a state (checked, disabled) should be both a `parameters` entry and a
  `states` entry with the same name, so token conditions can use it either way.

## Runtime

- Extend `ForwardsFocus(Base)` when there is a focusable inner control, and return it from
  `get [focusTarget]()`. Otherwise extend `Base`. Import both from `./internal/element.js`.
- Register with `export const defineX = defineElement("ds-x", DsX)`. It handles aliases,
  server-safety, and replaying properties set before registration. Do not write your own
  `customElements.define`.
- Never set attributes in the constructor. Attribute changes during an upgrade do not reach
  `attributeChangedCallback`.
- Every property with a setter is replayed on upgrade. A setter with side effects (Checkbox's
  `checked` marks the box dirty) must still behave when called from `connectedCallback`.
- Form controls follow Text field and Checkbox: `static formAssociated = true`, `attachInternals`,
  `formDisabledCallback`, `formResetCallback`, `formStateRestoreCallback`, and `setValidity` with
  the inner control as the anchor.
- Events: a native `input` event is composed and reaches the host. `change` is not composed;
  re-dispatch it from the host.
- Honor `:host([hidden]) { display: none; }`. The shared host checks test it.
- Put pseudo-classes (`:hover`, `:focus-visible`) on the inner control, not the host.

## Component tests

- Add the component's row to the table in `test/host-checks.test.js`. A test fails when a
  component in `src/` has no row. `test/package-root.test.js` finds components itself.
- Do not repeat the shared host checks in `<name>.test.js`.
- Token values: never set `--semantic-*` inline. The setup file loads the real `tokens.css`.
  Compare with `resolvedValue(property, "var(--token)")` from `test/helpers/tokens.js`.
- No test compares the implementation to the spec. Review them together.

## Docs implementation file

- `apps/documentation/implementation/<name>.md` is required for the component page. Its `api`
  rows map each web attribute, property, and event to a spec parameter or event by name.
- Keep the body to web-specific guidance. Rules, anatomy, and tokens come from the spec.
- Copy `implementation/button.md` or `text-field.md`.

## Docs example and Verify steps

- The example header is exactly:
  `/**\n * Verify: run the steps in \`<name>.verify.js\`. The docs tests run them against the built site.\n */`
  The docs test fails without it.
- `<name>.verify.js` is plain JS: `export default async function verify({ page, step, eventually })`.
  Name each step for what it proves. Use `eventually(read, expected, what)` for anything React
  updates after an action.
- Playwright CSS locators pierce open shadow roots: `form.locator("ds-checkbox input")`.
- The runner waits for hydration before your steps. Do not add sleeps.
- Mark stable handles in the example with `data-<name>-*` attributes and query those, not text
  positions or classes.
- `docs/components/<name>.mdx` holds preview prose only.

## Types

- `src/<name>.d.ts` and the `src/index.d.ts` entries are hand-written. Declare a property per
  public property, an attribute per public attribute, an enum alias for enum properties, and the
  `HTMLElementTagNameMap` entry.
- `examples/custom-elements.d.ts` maps element attributes onto JSX once. Check whether the new
  component needs an entry there.

## Commands

- `pnpm spec validate` reports each spec mistake once, with file and line.
- Several filters can run in one turbo command; each package builds once before its tests.
- The docs tests build the docs site first, so they take longer than the others.
