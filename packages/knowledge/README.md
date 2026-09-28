# @stevegreco/design-system-knowledge

The source of truth for Ember & Sage components: what each one is, when to use it, how it behaves,
which tokens it uses, and how the web component implements it. Authors edit files in `content/`.
The build validates them and writes a bundle that the component package, the docs site, and agents
read.

## Where to edit

| To change | Edit |
| --- | --- |
| A component: usage, rules, parameters, states, tokens, and its web element | `content/components/<name>/<name>.spec.yaml` |
| Guidance across components, such as action hierarchy | `content/patterns/*.md` |
| How-to guidance for one job, such as implementing Button | `content/guidelines/*.md` |
| An annotated example | `content/examples/*.md` |

A spec reads top to bottom by audience. Usage and content rules come first, then the contract,
then the `web:` section. Designers and writers can stop before `web:`.

Before adding a component or variant, read `content/guidelines/compose-or-propose.md`, then
[`docs/knowledge/new-component.md`](../../docs/knowledge/new-component.md). The Checkbox spec is
the most complete one to copy.

Write only what you mean. Each record needs `id`, `type`, `title`, and `summary`. The build fills
the rest: `status` defaults to `draft`, `jobs` follows from the type, the record's own name is
added to its `tags`, and the file itself becomes its authored source. List other files in
`sources` only when the record reads them, such as a token file.

Each spec starts with a `yaml-language-server` comment that names the schema. With the YAML
extension that `.vscode/extensions.json` recommends, the editor completes fields and marks
mistakes as you type.

## Build and check

From the repository root:

```bash
pnpm exec turbo run build --filter=@stevegreco/design-system-knowledge
pnpm exec turbo run test --filter=@stevegreco/design-system-components
pnpm exec turbo run dev --filter=documentation
```

The first command validates every record. Each error names the file, line, and field, once. The
second checks that the web components still match their specs. The third serves the docs site,
where a component page such as `/components/button` renders from the bundle.

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
catalog.related("component.button"); // records it lists in related, and records that list it
catalog.search("destructive button"); // ranked hits
catalog.list({ type: "guideline" });
catalog.markdownPath("component.button"); // the readable Markdown file
```

`markdown/<id>.md` is a readable page for each record, and is also exported as
`@stevegreco/design-system-knowledge/markdown/<id>.md`. A component page is enough to design,
build, or review with the component.

## Terms

| Term | Meaning |
| --- | --- |
| Record | One file in `content/`, compiled to one object with an id such as `component.button`. |
| Spec | A component record, written as `<name>.spec.yaml`. |
| Contract | The part of a spec that holds on every platform, in Figma and in code: parameters, anatomy, states, rules, and visuals. |
| Visuals | Which token each part uses for each variant and state. The build expands them into `mappings`. |
| States | A component's states, highest priority first. When two set the same channel, the earlier wins. |
| Web section | The `web:` part of a spec: the element's tag, attributes, events, and parts. |
| Related | The records to read alongside this one. A link in either record counts for both. |
| Bundle | The build output in `dist/public`: `records.json`, `search-index.json`, `manifest.json`, and Markdown. |

`schemaVersion` (1) is the authored format and the build fills it. `compiledSchemaVersion` (8) is
the bundle format, and `openCatalog` refuses a bundle built with another one. See
[CHANGELOG.md](CHANGELOG.md) for format changes.

## Design documents

[`docs/knowledge/`](../../docs/knowledge/README.md) holds the requirements, content model, and
decision records behind this package.
