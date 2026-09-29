# Knowledge content model

**Status:** Draft. Describes the model after the
[simplification plan](simplification-plan.md) and [ADR 0007](../adr/0007-simplified-knowledge-model.md).

## Design goals

The model serves two jobs. It is the contract that the web components and the Figma components are
built from, and it is the one source of knowledge that the docs site and agents read.

It must work as readable source material in Git, as deterministic build input, and as a portable
retrieval format. Structured facts are YAML: each component is one `*.spec.yaml` file. Narrative
guidance is Markdown with YAML frontmatter. Small records connect through `related`, so a consumer
can retrieve a focused answer and follow links when it needs more.

## Record types

| Type | Authored as | Holds |
| --- | --- | --- |
| `component` | `components/<name>/<name>.spec.yaml` | Metadata, the `contract`, the `web` section, and optional `tokenRef`. |
| `pattern` | `patterns/*.md` | Guidance for composing components, optionally with `variantGuidance`. |
| `guideline` | `guidelines/*.md` | How-to guidance for one job, optionally with `docsSections`. |
| `example` | `examples/*.md` | An annotated screen with `assets` and `annotations`. |
| `foundation` | Markdown | Reference knowledge such as color roles. None exist yet. |
| `decision` | Markdown | An architectural or design decision. None exist yet; ADRs stay in `docs/adr`. |

A component's platform implementation is part of its record. There is no separate binding record.

## Authored fields

Every record needs `id`, `type`, `title`, and `summary`. The rest is optional:

- `status` is `draft`, `accepted`, `deprecated`, or `superseded`. The build defaults it to `draft`.
- `jobs` lists `design`, `implement`, and `review`. The build derives it from the type when
  omitted: components serve all three, patterns all three, guidelines implement and review,
  examples design and implement, and foundations and decisions design.
- `tags` are extra search terms. The build adds the record's own name, such as `text-field`.
- `related` lists records to read alongside this one. A link counts in both directions.
- `sources` lists files the record reads, such as a token file or an ADR. The build adds the
  record's own file as its `authored` source.
- `visibility` is `public` or `internal`. The build takes it from the content root.

Unknown fields fail validation. `packages/knowledge/src/schema/knowledge-record.schema.json` is the
one authored schema, in JSON Schema 2020-12. Each spec's first line names it, so editors that use
`yaml-language-server` complete fields and mark mistakes.

Markdown records author a body. Component specs do not; the build generates the body from the
contract.

## The contract

`contract` holds what is true on every platform. Its vocabulary is neutral so a designer building
the Figma component and an engineer building the web component read the same facts.

- `description`: what the component does, in one sentence.
- `usage.do` and `usage.avoid`: situations, each with optional `instead` and `why` for avoid.
- `content`, `behavior`, and `accessibility.requirements`: rules. Each has an `id` unique in the
  contract, a `level` of `must`, `should`, or `may`, and a `statement`, with optional
  `applicability`, `rationale`, `references` to record IDs (with an optional heading `fragment`),
  and `examples.do` / `examples.avoid`. These rules are also the component's review checklist.
- `anatomy`: parts, each with a `name`, a `role` (`interactive-surface`, `label`, `description`,
  `indicator`, or `container`), and a `description`.
- `parameters`: options of kind `enum`, `boolean`, or `string`. An enum has `values` and may have
  `examples`; a default must match the kind and name one of the values.
- `configurationAxes`: conditions that are not parameters, such as `reducedMotion: [reduce]`.
- `events`: what the component reports, each with a description.
- `states`: the component's states, highest priority first, then `default`.
- `accessibility`: `semantics`, `name`, `keyboard`, and the requirement rules.
- `rationale`: decisions, especially what the component deliberately does not ship.
- `visuals`: which token each part uses.

### Visuals and states

`visuals` is keyed by anatomy part. Each part has `base` channels, part-wide `states`, and one
block per parameter or configuration axis, keyed by value. A value holds channels and its own
`states`.

The channels are `background`, `foreground`, `border`, `focus-ring`, `padding-horizontal`,
`padding-vertical`, `radius`, `gap`, `font-family`, `font-size`, `font-weight`, `line-height`,
`letter-spacing`, `motion`, `motion-duration`, and `motion-easing`. The schema's
`channelMapProperties` is the one list; the compiler's `CHANNEL_CSS` maps each to its CSS property.
A value is a published token name or one of the literals `transparent`, `inherit`, and `none`.

The build expands `visuals` into `mappings` rows of part, channel, configuration, optional state,
and token, and drops `visuals` from compiled output. Rules:

- For each part and channel, the first active state in `contract.states` that sets it wins, then
  rows with no state. Among rows for the same state, the one with more configuration keys wins.
- A state hides a lower one only on the channels it sets. Button's ghost disabled state sets its
  background to `transparent` so hover cannot show through.
- `default` is the rest state. It comes last in `states` and never has a `states` block.
- `motion: none` clears the motion duration and easing on the same part.
- Two rows for one part, channel, and state whose configurations can both apply, where neither is
  more specific, are a conflict.
- Every token name must exist in `packages/tokens/src/tokens`. Unknown parts, axes, values, and
  states fail the build.

Compiled `visualCoverage` lists the parts, axes, values, states, and channels each part covers,
and a warning names an axis value with no visuals.

## The web section

`web` holds how the web component implements the contract: `package`, `export`, `defaultTagName`,
`registration` (`export`, `supportsAliases`), `anatomy` (the `element`, `part`, or `slot` for each
contract part), `parameters`, `events` (the DOM `event` and optional `suppressedWhen`), `states`
(the attribute that drives a state such as `invalid`), `properties`, `formAssociation`, `focus`,
`parts`, `example`, `rationale`, and `notes`.

`web.parameters` lists exceptions only. A contract parameter with no entry maps to attribute
`kebab-case(name)` and property `name`; an entry replaces that default whole. A part with no
`web.parts` entry takes its anatomy description. The compiled record carries the resolved maps.

The build checks that `web.anatomy`, `web.parameters`, and `web.events` name exactly the contract's
parts, parameters, and events, that an enum's value map covers every value, that `web.states` names
contract states, and that a `web.parts` override names a rendered part.

## Composed sources

A record's authored fields are never overwritten. Declared sources compose into their own fields:

- `token-source` fills `tokens.entries` from the declared token file. It pairs with `tokenRef`,
  which fills `tokens.tier`, `tokens.namespace`, and `tokens.description`. A component without a
  component-token namespace has neither.
- `adr` adds a `kind: adr` source with path and revision, so a reader can follow the record to the
  decision. ADR prose stays with its package.

The token namespace must exist in the token file when a component declares `tokenRef`.

## Relationships

`related` is the only relationship. The build validates each target and adds the reverse link to
`backlinks.related` on the target, per visibility projection: an internal record's link never
appears on a public record. Compiled records keep the authored list in `relations.related`.

A pattern's `variantGuidance` maps a component it lists in `related` to that component's variants,
each naming a `###` heading in the pattern body. A list (`component.button: [primary, danger]`) is
shorthand for headings named after each variant. The build fails when an anchor, variant, or
component does not exist, or when two patterns guide the same variant.

The build resolves narrative links and images once, using the Markdown syntax tree, and rewrites
only each destination. Raw HTML `href`, `src`, and `poster` attributes use the same resolution.
Unknown local destinations fail the build.

## Provenance

A source is `authored` (the record's own file), `token-source`, `adr`, or `generated`. A record has
exactly one authored source, and its path must be the file the compiler parsed. Each compiled
`revision` is a digest of the bytes at that path. Compiled `bodyOrigin` says whether the body was
authored or generated.

## Visual examples

An example asset has a stable ID unique across the corpus, a repository-relative path, a media type
and dimensions, and alternative text. Annotations have an ID, a label, a description, and optional
`relatesTo` record IDs. The generated page renders the annotations, so a consumer that cannot see
the image still gets the decisions it shows. Image regions are not modeled yet.

## Visibility

Authored roots are `{ root, visibility }`, and a record's visibility must match its root. The public
bundle holds public records. When internal content is configured, the internal bundle holds public
and internal records. The build rejects a public record that links to an internal record or asset,
a path that leaves a record's allowed roots, an internal root that declares a public record, a
missing or unreadable root, and duplicate record or asset IDs. Visibility controls bundle inclusion,
not source access (KNOW-022).

## Compiled output

```text
dist/public/
├── manifest.json
├── records.json
├── search-index.json
├── schema/
│   ├── knowledge-record.json
│   └── compiled-knowledge-record.json
├── markdown/<id>.md
└── assets/
```

Both schemas are self-contained. `records.json` is the only owner of structured fields.
`markdown/<id>.md` is a readable page: identity frontmatter, then the body, then generated sections.
A component page adds install and register steps, the web API, slots and parts, DOM events, form
and focus behavior, and an example. Every page ends with its related records grouped by type.

The manifest `content` block records the schema versions, visibility, knowledge and design system
versions, record count, and per-file hashes, and its digest hashes that block. Build time and git
revision are outside the digest. `compiledSchemaVersion` is 8; a bundle with another version does
not open.

## Retrieval

`openCatalog` in `@stevegreco/design-system-knowledge/retrieve` opens a bundle directory, a URL, or
an in-memory `{ records, searchIndex, manifest }`, and returns `get`, `list`, `search`, `related`,
and `markdownPath`. Opening checks the manifest digest, the file hashes for a directory, and every
record against the compiled schema. `info.root` names the bundle directory.

Search tokenizes title, summary, tags, body, and contract and web facts. It stems plurals and -ing
forms, drops question words, and indexes hyphenated names whole and joined. Results rank by how
many query terms match, then by field weight times term rarity, then by type (component, pattern,
guideline, example).

## Compiler stages

`loadCorpusInputs` reads records, sources, and assets. `assembleCorpus` does no I/O: it expands
visuals, assembles records, resolves web defaults, runs the agreement checks, and rewrites narrative
links. Each problem names its file and line, and a record that fails to parse causes no further
errors in records that link to it. `projectBundle` computes backlinks per visibility and emits
files; `writeBundle` writes them.

## Source ownership

- `packages/tokens/` owns token values, token policy, and token ADRs.
- `packages/knowledge/content/components/` owns component contracts and their web sections.
- `packages/knowledge/content/` owns patterns, guidelines, examples, and annotations.
- `packages/components/` owns component runtime.
- `apps/documentation/` owns presentation and imports knowledge instead of restating it.
- Tool-specific directories own agent procedures, not design system facts.
