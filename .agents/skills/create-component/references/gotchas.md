# Gotchas

Things that cost time on Link, Checkbox, and the #128 checks. Grouped by the file you are in.

## Contents

- Spec and binding
- Runtime
- Component tests
- Computed-style mapping test
- Docs projector
- Docs example and Verify steps
- Types
- Build and test commands

## Spec and binding

- Author `visuals`, never `mappings`. The compiler expands `visuals` into mapping rows and fails
  when both exist.
- A state that changes the same channel as another state needs `stateResolution`. `suppress`
  says which state wins (Checkbox: `disabled` suppresses `checked`, `hover`, `indeterminate`,
  `invalid`; `indeterminate` suppresses `checked`). `independent` states (focus-visible) must not
  share channels with overlay or suppress winners, or the compiler rejects the overlap.
- The resolver has no combined states such as hover-and-checked. If a combination needs its own
  styling, it cannot be expressed. Record that in `rationale` (Checkbox did) instead of styling it
  anyway, or the mapping test will fail.
- A state that is really a boolean parameter (checked, indeterminate, disabled) should be both a
  `parameters` entry of `kind: boolean` and a `states` entry with the same name. The mapping test
  drives it through that parameter's attribute automatically.
- Text decoration, box geometry, and layout are not token channels. State them as behavior rules
  and rationale (Link's underline, Checkbox's 16px box), not visuals.
- Semantic tokens first (ADR 0003). A primitive is allowed only when no semantic role fits, and
  the rationale must say why (Checkbox's `primitives.radius.xs`). Only a component that declares
  `tokenRef.tier: component` may use `--component-*`, and then only those.
- Every `must` rule in `behavior` and `accessibility.requirements` needs a test or a reason in
  `unautomated-rules.js`. Write rules you can test. Keep rules about authored wording in
  `content`, which the census does not enforce.
- Binding `parameters` list only exceptions. With no entry, a parameter maps to attribute
  `kebab-case(name)` and property `name`. An entry replaces that default whole: Button's
  `fullWidth: { attribute: full-width }` is attribute-only, and `action` restates attribute and
  property because it adds `values`.
- Binding `parts` list only host detail the anatomy description lacks ("Hidden when empty.",
  "The inner native input."). Other parts take the anatomy description.
- `host.properties` holds read-only extras such as `form`. Its `type` string is copied into the
  generated `.d.ts`, so write it as TypeScript.
- A form control that contributes a value sets `formAssociation.submitsValue: true`. The generated
  type then declares `formResetCallback` and `formStateRestoreCallback`.

## Runtime

- Extend `ForwardsFocus(Base)` when there is a focusable inner control, and return it from
  `get [focusTarget]()`. Otherwise extend `Base`. Import both from `./internal/element.js`.
- Register with `export const defineX = defineElement("ds-x", DsX)`. It handles aliases,
  server-safety, and replaying properties set before registration. Do not write your own
  `customElements.define`.
- Never set attributes in the constructor. Attribute changes during an upgrade do not reach
  `attributeChangedCallback`.
- Every property with a setter is replayed on upgrade. A setter that has side effects (Checkbox's
  `checked` marks the box dirty) must still behave when called from `connectedCallback`.
- Form controls follow Text field and Checkbox: `static formAssociated = true`, `attachInternals`,
  `formDisabledCallback`, `formResetCallback`, `formStateRestoreCallback`, and `setValidity` with
  the inner control as the anchor.
- Events: a native `input` event is composed and reaches the host. `change` is not composed;
  re-dispatch it from the host.
- Honor `:host([hidden]) { display: none; }`. The shared host checks test it.

## Component tests

- Title each test for a rule with its ID in brackets: `test("[rule-id] …")`. Several IDs can share
  a title. Tags must name rules that exist in the contract, or the census fails.
- Visible focus, alias registration, `hidden`, focus forwarding, and properties set before
  registration are in `test/host-checks.test.js`, which runs for every binding. Its visible-focus
  title carries `[a11y-visible-focus]`, and the census credits that tag to every component whose
  contract has the rule. Use the same rule ID in a new contract.
- Token values: never set `--semantic-*` inline. The setup file loads the real `tokens.css`.
  Compare with `resolvedValue(property, "var(--token)")` from `test/helpers/tokens.js`.

## Computed-style mapping test

`test/contract-mappings.test.js` with cases from `test/commands/contract-cases.js`.

- Pseudo states (hover, pressed, focus-visible) are forced on the binding's `focus.forwardsTo`
  part. If the stylesheet puts the pseudo-class somewhere else (`:host(:hover)`, a wrapper), the
  test fails. Put it on the inner control.
- A boolean-parameter state is driven by its attribute. `invalid` is driven by a non-empty
  `error`. Any other attribute-driven state needs a driver added in `stateAttributes()`.
- A configuration axis that is not a parameter must be a media feature listed in `MEDIA_AXES`
  (only `prefersReducedMotion` today).
- If a state needs content before it applies (Link needs `href` for `:hover` and focus), add it
  to `FIXTURES` in `test/helpers/fixtures.js`. The host checks use the same fixtures.
- `inherit` is compared against the part's parent inside a container with distinctive type. Relative
  values resolve against the part's own font size.
- A failure names component, part, channel, configuration, state, and theme. Fix the stylesheet
  or the spec. Do not special-case the test.

## Docs projector

- Variant guidance is opt-in. Add the component and each variant's `###` anchor to the pattern's
  `variantGuidance`, and add the component to the pattern's `relations.guides`. A matching
  heading alone does nothing.
- A component can relate to several patterns; each shows in "Using together".
- A guideline shows under the page's usage through `docsSections.behavior: { section, heading }`.
  `section` is a `##` anchor in the guideline body; `heading` is what the page prints.

## Docs example and Verify steps

- The example header is exactly:
  `/**\n * Verify: run the steps in \`<slug>.verify.js\`. The docs tests run them against the built site.\n */`
  The docs test fails without it.
- `<slug>.verify.js` is plain JS: `export default async function verify({ page, step, eventually })`.
  Name each step for what it proves. Use `eventually(read, expected, what)` for anything React
  updates after an action.
- Playwright CSS locators pierce open shadow roots: `form.locator("ds-checkbox input")`.
- The runner waits for hydration before your steps. Do not add sleeps.
- Mark stable handles in the example with `data-<slug>-*` attributes and query those, not text
  positions or classes.

## Types

- `pnpm build` writes `src/<slug>.d.ts` from the binding and contract: a property per mapped
  property, an attribute per mapped attribute (`aria-*` skipped, since frameworks type them), an
  enum alias `<Slug><Property>` (`LinkVariant`), property prose from the parameter description,
  and `HTMLElementTagNameMap`. Fix a wrong type in the records, not the file.
- `examples/custom-elements.d.ts` maps the generated `ElementAttributes` onto JSX once. A new
  component needs no edit there.

## Build and test commands

- Rebuild knowledge after editing a spec or binding:
  `pnpm exec turbo run build --filter=@stevegreco/design-system-knowledge`.
- Run package tests one filter at a time. Two filters at once can race on the knowledge `dist/`
  and fail with `bundle-missing`.
- The docs tests build the docs site first (`apps/documentation/turbo.json`), so they take longer
  than the others.
