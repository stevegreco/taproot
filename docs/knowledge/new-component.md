# New component definition of done

This replaces the definition of done in #95. Use it for every component after Link.

## Build path

1. Tokens, only if no semantic role fits. See
   [token tier consumption](../../packages/tokens/docs/adr/0003-token-tier-consumption.md).
2. Component record: `packages/knowledge/content/components/<name>/<name>.spec.yaml`, with a
   contract and explicit `visuals`.
3. Binding: `packages/knowledge/content/bindings/<name>.web-component.md`.
4. Runtime: `packages/components/src/<name>.{js,css}`. The build generates `src/<name>.d.ts` and
   the package-root barrel (`src/index.js`, `src/index.d.ts`) from the binding and contract.
5. Docs: `apps/documentation/docs/components/<name>.mdx` and the example
   `apps/documentation/examples/<name>.tsx`.

## Decide what it does not ship

Decide each item below on purpose, before the contract is written. Deciding what Link would not
ship (no disabled state, no visited styling, no `target`) took the most judgment in #97, and
nothing prompted it.

Each item ends up in one of two places:

- **In the contract**, as a parameter, state, visual mapping, or behavior or accessibility rule.
- **In `contract.rationale`**, as a `decision` and `rationale` saying why the component does not
  have it. One entry can cover several items when the reason is the same.

| Item                             | Question to answer                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| Disabled                         | Can it be unavailable? If so, is it focusable and is the reason shown?               |
| Visited, selected, or checked    | Does it have a persistent on/off or visited state?                                   |
| Loading                          | Can it wait on work? Does it block activation while it does?                         |
| Invalid                          | Can its value be wrong? What message says so?                                        |
| Sizes                            | Does it need more than one size, and is that a size or a placement variant?          |
| Density                          | Does it change in compact layouts, or does the layout handle that?                   |
| Icon-only                        | Can it render without text? Where does its accessible name come from?                |
| Right-to-left                    | Does anything mirror (icons, padding, arrows) when `dir="rtl"`?                      |
| Reduced motion                   | Does it animate? What happens under `prefers-reduced-motion: reduce`?                |
| High contrast and forced colors  | Does every state stay visible under `forced-colors: active`, without color alone?    |

Link is the reference. Its rationale records no disabled state ("a link with no destination is
text"), no visited styling, and placement as a variant rather than a size.

Existing components are not retrofitted in one pass. Add their rationale entries when each is next
touched.

## Prove it

- Every `must` rule in `contract.behavior` and `contract.accessibility.requirements` has a test in
  `packages/components/test/<name>.test.js` whose title starts with the rule ID in brackets, or a
  reason in `packages/components/test/unautomated-rules.js`. The rule census enforces this.
- The computed-style mapping test renders the component in each configuration and state.
  Anything a state needs before it can apply (Link needs an `href`) goes in that test's fixtures.
- The docs examples type-check against the generated element types. The example-types test
  enforces this.
- `examples/<name>.tsx` has a `Verify:` header naming `examples/<name>.verify.js`, and the docs
  tests run those steps against the built site.

## Review

The PR description lists each checklist item that is not in the contract and points to its
rationale entry.
