# @stevegreco/design-system-knowledge

The source of truth for Ember & Sage components: what each one is, when to use it, how it behaves,
which tokens it uses, and how the web component implements it. Authors edit files in `content/`.
The build validates them and writes a bundle that the component package, the docs site, and agents
read.

## Where to edit

| To change | Edit |
| --- | --- |
| A component's variants, states, rules, or tokens | `content/components/<name>/<name>.spec.yaml` |
| How the web component exposes it (tag, attributes, events) | `content/bindings/<name>.web-component.md` |
| Guidance across components, such as action hierarchy | `content/patterns/*.md` |
| Implementation or review guidance | `content/guidelines/*.md` |
| An annotated example | `content/examples/*.md` |

Before adding a component or variant, read `content/guidelines/compose-or-propose.md`, then
[`docs/knowledge/new-component.md`](../../docs/knowledge/new-component.md). The Checkbox spec is
the most complete one to copy.

Write only what you mean. The build fills `schemaVersion`, `visibility`, and the file's own
`sources` entry. List other files in `sources` only when the record reads them, such as a token
file.

## Build and check

From the repository root:

```bash
pnpm exec turbo run build --filter=@stevegreco/design-system-knowledge
pnpm exec turbo run test --filter=@stevegreco/design-system-components
pnpm exec turbo run dev --filter=documentation
```

The first command validates every record. Errors name the file, line, and field. The second checks
that the web components still match their specs. The third serves the docs site, where a component
page such as `/components/button` renders from the bundle.

## Authored and generated

Everything under `content/` is authored. Everything under `dist/` is generated, so do not edit it.
The component package's `src/*.d.ts` and `src/index.js` are also generated from the bundle, and CI
fails when they are stale. Component CSS in `packages/components/src/*.css` is written by hand, and
tests fail when it reads a token its spec does not map.

## Reading the bundle

```js
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";

const catalog = await openCatalog();
catalog.get("component.button"); // the full compiled record
catalog.related("component.button"); // its binding, patterns, guidelines, and examples
catalog.search("destructive button"); // ranked hits
catalog.list({ type: "guideline" });
```

`dist/public/markdown/<id>.md` has a readable version of each record.

## Terms

| Term | Meaning |
| --- | --- |
| Record | One file in `content/`, compiled to one object with an id such as `component.button`. |
| Spec | A component record, written as `<name>.spec.yaml`. |
| Contract | The part of a spec that holds for every platform: parameters, states, events, rules, visuals. |
| Parameter | An input to a component, such as `variant` or `disabled`. |
| Visuals | Which token each part uses for each variant and state. Compiled into `mappings`. |
| Binding | How one platform implements a spec. Today the only platform is the web component. |
| Host | The binding's platform-specific details: tag name, attributes, events, and parts. |
| Pattern | Guidance that spans components, such as choosing between Button and Link. |
| Guideline | Guidance for one job, such as implementing or reviewing a component. Review guidelines have `checks`. |
| Relations | Links a record declares, such as `guides` or `uses`. |
| Backlinks | The reverse of relations, filled in by the build. |
| Bundle | The build output in `dist/public`: `records.json`, `search-index.json`, `manifest.json`, and Markdown. |
| Catalog | The bundle opened with `openCatalog`. |
| Jobs | Who a record serves: `design`, `implement`, or `review`. |
| Visibility | `public` or `internal`. All content today is public, which is the default. |

Three version numbers track three formats. `schemaVersion` (1) is the authored record format.
`specVersion` (5) is the contract format. `compiledSchemaVersion` (7) is the bundle format, and
`openCatalog` refuses a bundle built with another one. See [CHANGELOG.md](CHANGELOG.md) for format
changes.

## Design documents

[`docs/knowledge/`](../../docs/knowledge/README.md) holds the requirements, content model, and
decision records behind this package.
