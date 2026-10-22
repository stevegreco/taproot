# Gotchas

Grouped by the file you are in. The docs example and Verify steps have their own skill,
document-component.

## Contents

- Spec
- Runtime
- Component tests
- Docs implementation file
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
  `parameters.variant.destructive`. A missing target is a validation error.
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
- Set the host's own role, accessible name, and hidden state through `ElementInternals`
  (`this.#internals.role`, `ariaLabel`, `ariaHidden`), not `role` or `aria-*` attributes. That
  keeps the consumer's attributes theirs and works in the constructor. Icon is the reference.
- Every property with a setter is replayed on upgrade. A setter with side effects (Checkbox's
  `checked` marks the box dirty) must still behave when called from `connectedCallback`.
- Form controls follow Text field and Checkbox: `static formAssociated = true`, `attachInternals`,
  `formDisabledCallback`, `formResetCallback`, `formStateRestoreCallback`, and `setValidity` with
  the inner control as the anchor.
- Events: a native `input` event is composed and reaches the host. `change` is not composed;
  re-dispatch it from the host.
- Honor `:host([hidden]) { display: none; }`. The shared host checks test it.
- With `slotAssignment: "manual"`, call `slot.assign()` after the slot is in the shadow root.
  Chromium can drop an assignment made on a slot that is not connected yet, and only markup parsed
  before registration (server-rendered pages) shows it. Accordion's test for that case is the
  reference.
- Put pseudo-classes (`:hover`, `:focus-visible`) on the inner control, not the host.

## Component tests

- Add the component's row as `test/host-checks/<name>.js`. A test fails when a component in
  `src/` has no row. `test/package-root.test.js` finds components itself.
- Do not repeat the shared host checks in `<name>.test.js`.
- Token values: never set `--ds-semantic-*` inline. The setup file loads the real `tokens.css`.
  Compare with `resolvedValue(property, "var(--token)")` from `test/helpers/tokens.js`.
- Role and name set through `ElementInternals` are invisible to the DOM, and to Vitest and
  Playwright role locators. Read them with `exposedNodes()` from `test/helpers/accessibility.js`,
  which returns `{ role, name }` for each node in the browser's accessibility tree. Do not call
  `Accessibility.getFullAXTree` yourself: tests run in an iframe, the call reads the top frame by
  default, and an "is hidden" assertion then passes against a tree that never had the component.
  The helper throws instead.
- A negative test (no live region, no focus, no events, hidden from assistive technology) passes
  just as well for an element that never rendered. Start it with
  `expectRendered(element, "part", …)` from `test/helpers/rendered.js`, which fails unless the
  element upgraded and rendered those parts. Then see the test fail at least once.
- No test compares the implementation to the spec. Review them together.

## Docs implementation file

- `apps/documentation/implementation/<name>.md` is required for the component page. Its `api`
  rows map each web attribute, property, and event to a spec parameter or event by name.
- Keep the body to web-specific guidance. Rules, anatomy, and tokens come from the spec.
- Copy `implementation/button.md` or `text-field.md`.

## Types

- `src/<name>.d.ts` is hand-written. Declare a property per public property, an attribute per
  public attribute, an enum alias for enum properties, and the `HTMLElementTagNameMap` entry. The
  build generates `src/index.js` and `src/index.d.ts` from `src/`, taking each tag name from that
  entry and its attributes from the matching `<ClassName>Attributes` interface.

## Commands

- `pnpm spec validate` reports each spec mistake once, with file and line.
- Several filters can run in one turbo command; each package builds once before its tests.
