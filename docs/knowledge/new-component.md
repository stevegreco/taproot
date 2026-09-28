# Adding a component

First confirm the need is a new component. The
[Compose or propose](../../packages/knowledge/content/guidelines/compose-or-propose.md) guideline
says when to compose existing components instead.

A component has two halves. A designer or writer can own the first. An engineer owns the second.

## 1. Write the spec

Copy `packages/knowledge/content/components/checkbox/checkbox.spec.yaml` to
`packages/knowledge/content/components/<name>/<name>.spec.yaml`. The schema comment on its first
line gives you completion and inline errors in the editor.

Fill it in top to bottom:

| Field | What to write |
| --- | --- |
| `id`, `title`, `summary` | `component.<name>`, the display name, and one sentence starting "Use <Name> to…". |
| `related` | The components and patterns someone should read next. |
| `contract.description` | What it does, in one sentence. |
| `contract.usage` | When to use it (`do`) and when not to (`avoid`, with what to use `instead` and `why`). |
| `contract.content` | Rules for labels and messages, each with an `id`, a `level` (`must`, `should`, or `may`), and a `statement`. |
| `contract.anatomy` | Its parts, such as `control`, `label`, and `hint`. |
| `contract.parameters` | Its options, such as `variant`, `size`, or `disabled`, with their values and default. |
| `contract.states` | Its states, highest priority first, then `default`. |
| `contract.behavior`, `contract.accessibility` | What it must do and how it is announced and operated. |
| `contract.visuals` | The token each part uses, per variant and state. A higher state hides a lower one only on the channels it sets. |
| `contract.rationale` | What it deliberately does not do, and why. See the table below. |

Then build the knowledge package. Each mistake is reported once, with its file and line:

```bash
pnpm exec turbo run build --filter=@stevegreco/design-system-knowledge
```

Only add tokens when no semantic role fits. See
[token tier consumption](../../packages/tokens/docs/adr/0003-token-tier-consumption.md).

### Decide what it does not ship

Decide each item on purpose before the contract is written. Each ends up either in the contract,
as a parameter, state, visual, or rule, or in `contract.rationale`, as a `decision` and
`rationale` saying why the component does not have it. One entry can cover several items when the
reason is the same.

| Item | Question to answer |
| --- | --- |
| Disabled | Can it be unavailable? If so, is it focusable and is the reason shown? |
| Visited, selected, or checked | Does it have a persistent on/off or visited state? |
| Loading | Can it wait on work? Does it block activation while it does? |
| Invalid | Can its value be wrong? What message says so? |
| Sizes | Does it need more than one size, and is that a size or a placement variant? |
| Density | Does it change in compact layouts, or does the layout handle that? |
| Icon-only | Can it render without text? Where does its accessible name come from? |
| Right-to-left | Does anything mirror (icons, padding, arrows) when `dir="rtl"`? |
| Reduced motion | Does it animate? What happens under `prefers-reduced-motion: reduce`? |
| High contrast and forced colors | Does every state stay visible under `forced-colors: active`, without color alone? |

Link is the reference. Its rationale records no disabled state ("a link with no destination is
text"), no visited styling, and placement as a variant rather than a size.

## 2. Build and test it

1. Add the `web:` section to the spec: package, export, tag, registration, and how each part,
   parameter, and event maps to the element. Only list parameters whose attribute or property is
   not the kebab-case or same-name default.
2. Write the runtime in `packages/components/src/<name>.{js,css}`. The build generates
   `src/<name>.d.ts` and the package-root barrel from the spec.
3. Add the docs example `apps/documentation/examples/<name>.tsx` and its Verify steps. The
   `/components/<name>` page renders from the catalog. `docs/components/<name>.mdx` is optional
   preview prose.

### Prove it

- Every `must` rule in `contract.behavior` and `contract.accessibility.requirements` has a test in
  `packages/components/test/<name>.test.js` whose title carries the rule ID in brackets, or a
  reason in `packages/components/test/unautomated-rules.js`. The rule census enforces this and
  ignores skipped and commented-out tests.
- The computed-style mapping test renders the component in each configuration, each state, and
  each pair of states. Anything a state needs before it can apply (Link needs an `href`) goes in
  `packages/components/test/helpers/fixtures.js`.
- The shared host checks cover registration aliases, `hidden`, focus forwarding, visible focus,
  events, enum properties, and properties set before registration for every component. The
  component's own test file covers only its behavior.
- The docs examples type-check against the generated element types.
- `examples/<name>.tsx` has a `Verify:` header naming `examples/<name>.verify.js`, and the docs
  tests run those steps against the built site.

## Review

The PR description lists each item from the table that is not in the contract and points to its
rationale entry.
