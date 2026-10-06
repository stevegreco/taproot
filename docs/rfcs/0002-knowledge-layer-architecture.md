# RFC 0002: Knowledge layer architecture

**Status:** Accepted
**Created:** 2026-09-29
**Accepted in:** [ADR 0001](../adr/0001-knowledge-layer-scope.md),
[ADR 0002](../adr/0002-record-format.md), [ADR 0003](../adr/0003-knowledge-delivery.md)
**Supersedes:** the earlier ADRs 0001 through 0007, removed in the same change (available in git
history)
**Renamed:** 2026-10-05, the knowledge layer is now the design system spec: `packages/spec`,
`@stevegreco/design-system-spec`, and the `ds-spec` CLI. The text below keeps the original names.

## Summary

Reset the knowledge layer to one job: a single, portable source of design system knowledge that
design and engineering agree on before implementation, served first to agents through a CLI and an
MCP server, and second to the docs site.

The spec describes what a component is and how to use it. It does not describe how any technology
builds it. There is no compile step, no compiled record format, and no check of implementation
code against the spec. Authored files are validated against a JSON Schema, indexed in memory, and
served as they are.

The format, the JSON Schema, and the reference CLI and MCP server are designed so another design
system can point them at its own content folder. Ember & Sage is the working example.

## Goals

1. **One contract before implementation.** A component record is the north star that design and
   engineering both work from.
2. **No implementation details.** Nothing assumes React, web components, Figma, or any other
   technology.
3. **Visual mappings are allowed.** A record may map anatomy parts to design tokens.
4. **Links are a first-class feature.** Components, patterns, guidelines, and examples link to one
   another with typed relations, down to a section, so an agent can pull exactly the context it
   needs.
5. **Agents first.** The main consumer is an agent using a CLI or MCP server. The docs site is the
   second consumer.
6. **Portable.** The format works for any design system without changes.

## Non-goals

- Validating component code, Figma files, or rendered output against the spec.
- Recording implementation facts: tag names, attributes, slots, parts, form association, framework
  props, or code snippets.
- Importing knowledge from Figma, Notion, or other tools. Knowledge is written here by hand, and
  existing content is migrated once.
- Semantic or embedding search. Keyword search and link traversal come first.
- Resolving token values in the core spec. Token references are opaque strings.

## Evidence

The system on `refactor/knowledge-simplification` today:

- `packages/knowledge/src` holds about 5,200 lines: a compiler, a compiled record schema at version
  8, a digest, a bundle, generated Markdown, a search index, state-priority resolution, and a
  channel-to-CSS map (`CHANNEL_CSS`). The content it compiles is about 2,900 lines for five
  components, one pattern, three guidelines, and one example.
- Every component spec has a `web:` section with the tag name, attribute mappings, slots, shadow
  parts, and form association. Two of the three guidelines,
  `guideline.button-implementation` and `guideline.text-field-implementation`, are mostly
  `<ds-button>` and `defineButton()` code.
- Commit `6433867` tests every `web:` fact against the runtime. ADR 0007 relies on component tests
  that render every pair of states from the spec.
- `contract.states` carries a priority order so that a state's token values can be computed. Only
  something that computes styles from the spec needs that order.
- `tokenRef` and `sources` assume this repository's token tiers and file paths.
- There is no CLI or MCP server. Agents have only the `openCatalog()` JavaScript API.
- `apps/documentation/lib/component-knowledge.ts` (838 lines) reads the compiled records and
  requires each component's `web:` section to build its pages.

Most of this weight serves goals this RFC drops: executable specs, one platform's bindings, and a
stable compiled format.

## Proposed model

### Record types

The spec defines four types. Adopters cannot add types; a fixed set is what lets tools and agents
rely on a record's shape.

| Type        | File                          | Holds                                                    |
| ----------- | ----------------------------- | -------------------------------------------------------- |
| `component` | `<name>.spec.yaml`            | The contract: usage, anatomy, API, states, rules, tokens |
| `pattern`   | `<name>.md` with front matter | Guidance for a problem solved with several components    |
| `guideline` | `<name>.md` with front matter | Cross-cutting guidance, such as content or composition   |
| `example`   | `<name>.md` with front matter | A worked, annotated example with image assets            |

Components stay in YAML because most of a component is structured. The other types are prose with
a small front matter block.

The loader finds records by suffix anywhere under the configured content folder. The folder layout
is a convention, not part of the spec. A record's identity is its `id`, not its path.

### Common fields

Every record has:

| Field     | Required | Notes                                                                      |
| --------- | -------- | -------------------------------------------------------------------------- |
| `id`      | yes      | `<type>.<name>`. The name is lowercase words joined by `-` or `.`.         |
| `type`    | yes      | One of the four types.                                                     |
| `title`   | yes      | Display name.                                                              |
| `summary` | yes      | One sentence that says when to use it. Search and lists show this.         |
| `tags`    | no       | Free keywords for search.                                                  |
| `status`  | no       | `draft`, `stable`, or `deprecated`. Defaults to `stable`.                  |
| `links`   | no       | Typed links to other records. See [Links](#links).                        |
| `sources` | no       | Where the knowledge came from: `{ title, url }` pairs, for provenance only. |

`sources` no longer drives build steps. It records, for a human or an agent, that a rule came from
a Figma file, a research report, or a decision thread.

### Component records

A component record is the contract. Every field describes the component, not an implementation of
it.

```yaml
id: component.button
type: component
title: Button
summary: Use Button to trigger an action or to submit or reset a form.
tags: [action, form]
links:
  follows: [pattern.action-hierarchy#assign-emphasis]
  related: [component.badge]

description: Triggers an action or submits or resets a form.

usage:
  do:
    - Trigger an action in the current view.
    - Submit or reset a form.
  avoid:
    - situation: Navigate to another location.
      instead: component.link
      why: Links provide navigation semantics.

anatomy:
  control:
    role: interactive-surface
    description: Interactive control.
  content:
    role: label
    description: Action label with an optional decorative icon.

parameters:
  variant:
    kind: enum
    values:
      primary: Highest-emphasis action.
      secondary: Supporting action.
      ghost: Low-emphasis action.
      danger: Destructive or difficult-to-reverse action.
    default: primary
  disabled:
    kind: boolean
    default: false

events:
  activate: Requests the action represented by the button.

states: [default, hover, focus, pressed, disabled]

rules:
  - id: label-describes-result
    level: must
    topic: content
    statement: Use a concise label that describes the result.
    examples: { do: [Save changes], avoid: [Click here] }
  - id: disabled-prevents-activation
    level: must
    topic: behavior
    statement: Disabled prevents activation.
  - id: visible-focus
    level: must
    topic: accessibility
    statement: Keyboard focus remains visibly indicated.

accessibility:
  role: button
  name: From visible content, or an accessible name when content is insufficient.
  keyboard:
    Enter: Activate.
    Space: Activate.

tokens:
  control:
    base:
      radius: component.button.radius
    variant.primary:
      background: component.button.primary.background.default
    variant.primary + hover:
      background: component.button.primary.background.hover
    size.sm:
      padding-horizontal: component.button.size.small.paddingInline

rationale:
  - decision: Button has its own token namespace.
    why: Consumers need a stable customization boundary for variants and states.
```

The changes from today's spec:

- **No `web:` section.** Implementation facts leave the knowledge layer. See
  [Implementation content](#implementation-content).
- **No `contract:` wrapper.** The whole record is the contract, so the wrapper adds a level and
  nothing else.
- **One `rules` list.** Content, behavior, and accessibility rules share one list with a `topic`.
  Every rule keeps a stable `id` and a `must`, `should`, or `may` level, so an agent can cite and
  review against it. Its full address is `component.button#label-describes-result`.
- **`accessibility` holds the neutral facts:** role, name, and keyboard. The requirements move into
  `rules` with `topic: accessibility`.
- **`states` is a plain list.** Its order carries no meaning.
- **`tokens` replaces `visuals` and `tokenRef`.** See [Tokens](#tokens).
- **`usage.do` items are plain strings.** `avoid[].instead` is a record ID, so it also produces an
  `alternative` link.
- **`events` values are descriptions.** Parameter kinds are `enum`, `boolean`, `string`, and
  `number`.

### Tokens

`tokens` maps each anatomy part to conditions, and each condition to properties and token
references:

```yaml
tokens:
  <part>:
    <condition>:
      <property>: <token reference or keyword>
```

- A **condition** is `base`, a parameter value (`variant.primary`), a state (`hover`), a user
  preference (`reducedMotion.reduce`), or several joined with `+` (`variant.primary + hover`). Condition names must match the record's parameters
  and states. The schema cannot check that, so the loader does.
- A **property** is a neutral name, such as `background`, `foreground`, `border`, `radius`, `gap`,
  `padding-horizontal`, `focus-ring`, or `motion-duration`. The spec recommends this list but
  accepts others.
- A **token reference** is an opaque string. The spec does not know the adopter's token format or
  tiers. `transparent` and `none` are allowed as keywords.

This is reference data for a designer or an agent reading "what does primary hover use?" It has no
resolution rules. Nothing in the spec computes the final style of a combination.

To answer "what value is that token?", an adopter can configure a **token resolver** that reads its
token files, for example DTCG JSON. The reference CLI ships a DTCG resolver. The resolver is
optional and outside the core format.

### Links

Links are how an agent moves from one record to what surrounds it. Each link has a kind:

| Kind          | Authored on         | Meaning                                         | Inverse       |
| ------------- | ------------------- | ----------------------------------------------- | ------------- |
| `alternative` | component (derived) | Use the target instead in a named situation     | `alternative-to` |
| `composes`    | component           | This component is built from the target         | `used-in`     |
| `follows`     | any                 | This record applies the target pattern or guideline | `followed-by` |
| `example-of`  | example             | This example demonstrates the target            | `examples`    |
| `related`     | any                 | Worth reading together, with no stronger claim  | `related`     |

Authors write links once, on one side. The index adds the inverse, so `component.button` lists its
examples without the author adding them to the Button record.

`alternative` is not authored in `links`. The loader derives it from `usage.avoid[].instead`, so the
reason ("Links provide navigation semantics") travels with the link and the fact is written once.
Rule `references`, such as a rule that points at a pattern section, are also derived as `follows`
links.

Any link can target a section: `pattern.action-hierarchy#assign-emphasis`. Sections are:

- in Markdown records, heading slugs;
- in component records, rule IDs and the top-level field names (`usage`, `anatomy`, `parameters`,
  `tokens`, and so on);
- in example records, annotation IDs.

The loader reports a link to a missing record or section as an error.

`pattern.action-hierarchy` has a `variantGuidance` map today. It becomes links to parameter values,
such as `component.button#parameters.variant.danger`, so no special field is needed.

### Pattern, guideline, and example records

These records are Markdown with the common front matter. Examples keep `assets` (image files with
alt text) and `annotations` (IDs with a label and description that other records can link to).
`guideline.compose-or-propose` stays. The two implementation guidelines move out. `docsSections`
leaves the front matter, because the docs site decides its own layout.

## Retrieval

### Library

One small library does all the work, and the CLI, the MCP server, and the docs site call it.

- `load(config)` reads the content folder, validates each record against the JSON Schema, checks
  cross-record facts (links, sections, token conditions), and builds an in-memory index. Errors
  name the file and line.
- `get(id)` returns a record. With a section (`id#section`), it returns just that section.
- `search(query, { type, tags })` does keyword search over titles, summaries, tags, usage, and rule
  statements, and returns IDs with summaries.
- `links(id, { kind, direction })` returns neighbors, with inverses included.
- `rules({ id, topic, level, query })` returns rules across one record or all records, with their
  full addresses.
- `tokens(id, { part, condition, resolve })` returns token mappings, with values when a resolver is
  configured.
- `render(id)` returns Markdown for a record. Component records are YAML, so the renderer is how an
  agent or a person reads one as prose.

Loading five components and a few Markdown records takes milliseconds, so there is no build
output, no cache, and no compiled format to version. The version a consumer checks is the spec
version declared in the JSON Schema `$id`.

### CLI

```bash
knowledge validate
knowledge search "destructive action"
knowledge get component.button
knowledge get pattern.action-hierarchy#assign-emphasis
knowledge links component.button --kind alternative
knowledge rules --level must --topic accessibility
knowledge tokens component.button --part control --condition "variant.primary + hover"
```

Output is Markdown by default and JSON with `--json`. The CLI finds its content folder through a
`knowledge.config.json` file or a `--content` flag, so any design system can use it.

### MCP server

A local stdio server exposes the same operations as tools: `search`, `get`, `links`, `rules`, and
`tokens`. Records are also exposed as MCP resources at `knowledge://<id>`. The server loads the
content folder at startup and reloads it when files change.

### The three priority tasks

| Task                        | Calls                                                                     |
| --------------------------- | ------------------------------------------------------------------------- |
| Choose a component          | `search`, then `get` on the top result and `links --kind alternative`     |
| Review against guidance     | `rules` for the components on the screen, plus `links --kind follows` to reach the patterns they apply |
| Look up tokens              | `tokens` with a part and a condition, with values if a resolver is set    |

## Portability

The public package is the written spec, the JSON Schema, and the reference library, CLI, and MCP
server.

Fixed by the spec:

- the four record types and their fields;
- the ID syntax, `<type>.<name>`;
- the link kinds and section addressing;
- the rule levels `must`, `should`, and `may`, with RFC 2119 meaning;
- the parameter kinds and the condition syntax for tokens.

Chosen by each adopter:

- record names, anatomy part names, parameter names, and state names;
- token reference strings and, optionally, a resolver;
- the content folder layout;
- tags.

Ember & Sage's content lives in this repository as the reference corpus and the test fixture for
the tools.

## Implementation content

Implementation facts leave the knowledge layer:

- The `web:` sections are deleted. The facts they held (tag names, attribute mappings, slots,
  parts, form association) already live in `packages/components` source and types.
- `guideline.button-implementation` and `guideline.text-field-implementation` move to the docs app,
  next to the implementation they describe.
- The docs site builds each component page from two sources: the knowledge record for usage, rules,
  anatomy, and tokens, and the components package for installation, code examples, and the API
  table. How the components package publishes its half (a small Markdown file per component, or a
  generated custom elements manifest) is a separate decision for that package.

When the knowledge layer later needs implementation links, the likely shape is an `implementations`
list of `{ platform, url }` pairs on a component. This RFC does not add it.

## What is removed

- The compiler, compiled record schema, digest, bundle, manifest, and everything under
  `dist/public`, with their package exports.
- `CHANNEL_CSS`, state priority, and `configurationAxes` resolution.
- The `web:` section and its schema, and the token-source and ADR source readers.
- The tests for those, including the runtime `web:` fact tests from commit `6433867` and any
  component test that derives rendering from the spec.
- `docsSections`, `variantGuidance`, `tokenRef`, and the `contract:` wrapper.

## What is kept

- Hand-authored YAML components and Markdown records.
- JSON Schema validation, with editor completion and inline errors (commit `d142f12`).
- Errors that name the file and line.
- Stable rule IDs and levels.
- Anatomy, parameters, events, states, accessibility, usage, and rationale.
- Section-level links and the example assets.
- Keyword search.

## Decision records

On acceptance, ADRs 0001 through 0007 are deleted, along with `docs/knowledge/`
(`requirements.md`, `content-model.md`, `simplification-plan.md`, `architecture-review-2026-09-04.md`,
and `new-component.md`). Git keeps their history. They are replaced by:

- **ADR 0001, Knowledge layer scope:** a technology-neutral contract, no implementation facts, no
  validation of implementations, and agents as the main consumer.
- **ADR 0002, Record format:** the four types, the fields, links, sections, and tokens.
- **ADR 0003, Delivery:** load from source, with no compile step, and one library behind the CLI,
  the MCP server, and the docs site.

The written spec itself lives at `packages/knowledge/SPEC.md`, because it is what another design
system reads.

## Migration

One branch from `main`, one commit per step:

1. **Format.** Write `SPEC.md` and the new JSON Schema. Migrate the five component specs and the
   Markdown records. Delete the `web:` sections and move the implementation guidelines to the docs
   app.
2. **Library.** Write the loader, index, and retrieval functions, and the renderer. Delete the
   compiler and its exports and tests.
3. **CLI and MCP server.**
4. **Docs site.** Move `apps/documentation` onto the library, and take installation and code
   content from the components package.
5. **Clean up.** Remove the runtime `web:` fact tests and spec-driven component tests. Replace the
   ADRs and `docs/knowledge/`. Update the `create-component` skill.

This RFC is written on `refactor/knowledge-simplification`. That branch merges to `main` first,
because its neutral channel names, shorter metadata, editor completion, and line-numbered errors
carry forward. The migration then starts on a new branch from `main` and reverses the parts this
RFC drops: state priority, the `web:` fold, and the runtime fact tests.

## Resolved in review

- **Token map shape:** joined condition keys, such as `variant.primary + hover`.
- **User preferences:** token conditions, such as `reducedMotion.reduce: { motion: none }`.
- **Visibility:** the public and internal visibility field is dropped until someone needs a
  private corpus.
- **Branch:** merge `refactor/knowledge-simplification` first, then migrate from `main`.

## Open questions

1. Are the four record types and five link kinds right? Should `foundation` (color, type, spacing)
   become a type later, or stay as guidelines?
2. What should the CLI and package be called if the spec is published outside Ember & Sage?
