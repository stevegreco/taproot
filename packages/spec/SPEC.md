# Design system spec format

**Version:** 1 (`urn:design-system-spec:record:1`)

This format holds a design system spec as plain files: what each component is and how to
use it, and the patterns, guidelines, and examples around it. Design and engineering agree on a
component here before either builds it. Agents and docs sites read it.

The format describes components, not implementations. It never assumes a technology: no
framework, element, attribute, or file names from any platform. A component record says what
Button is, what options it has, how it behaves, and which design tokens paint each part. How a web
component, a React component, or a Figma component realizes that is recorded elsewhere.

The JSON Schema is [`src/schema/spec-record.schema.json`](src/schema/spec-record.schema.json).
A record that passes the schema and the [cross-record checks](#cross-record-checks) is valid.

## Records

A record is one file. There are four types:

| Type        | File                          | Holds                                                         |
| ----------- | ----------------------------- | ------------------------------------------------------------- |
| `component` | `<name>.spec.yaml`            | The contract: usage, anatomy, parameters, states, rules, tokens |
| `pattern`   | `<name>.md` with front matter | Guidance for a problem solved with several components         |
| `guideline` | `<name>.md` with front matter | Cross-cutting guidance, such as content, composition, or process |
| `example`   | `<name>.md` with front matter | A worked, annotated example with image assets                 |

Tools find records by suffix anywhere under a content folder: every `*.spec.yaml` file, and every
`*.md` file whose front matter has an `id`. The folder layout is up to the adopter. A record's
identity is its `id`, not its path.

### Common fields

| Field     | Required | Meaning                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------- |
| `id`      | yes      | `<type>.<name>`, such as `component.text-field`. The prefix must equal `type`.     |
| `type`    | yes      | `component`, `pattern`, `guideline`, or `example`.                               |
| `title`   | yes      | Display name.                                                                    |
| `summary` | yes      | One sentence that says when to use the subject. Lists and search results show it. |
| `tags`    | no       | Lowercase, hyphenated keywords for search.                                       |
| `status`  | no       | `draft`, `stable`, or `deprecated`. Defaults to `stable`.                        |
| `links`   | no       | Typed links to other records. See [Links](#links).                               |
| `sources` | no       | Provenance: `{ title, url }` pairs naming where the record came from.            |

A name is lowercase letters and digits in words joined by hyphens. A name inside an ID may have
more than one dotted segment, such as `example.action-hierarchy.settings`.

## Component records

A component record is YAML. Every field describes the component.

```yaml
id: component.button
type: component
title: Button
summary: Use Button to trigger an action or to submit or reset a form.
description: Triggers an action or submits or resets a form.

usage:
  do:
    - Trigger an action in the current view.
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
      danger: Destructive or difficult-to-reverse action.
    examples:
      primary: Save changes
      danger: Delete project
    default: primary
  disabled:
    kind: boolean
    default: false

events:
  activate: Requests the action represented by the button.

states: [default, hover, focus, pressed, disabled]
preferences:
  reducedMotion: [reduce]

rules:
  - id: label-describes-result
    level: must
    topic: content
    statement: Use a concise label that describes the result.
    examples: { do: [Save changes], avoid: [Click here] }
  - id: follow-action-hierarchy
    level: should
    topic: content
    statement: Apply the action hierarchy pattern when several actions appear together.
    references: [pattern.action-hierarchy#assign-emphasis]

accessibility:
  role: Button
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
    reducedMotion.reduce:
      motion: none

rationale:
  - decision: Button has its own token namespace.
    why: Consumers need a stable customization boundary for variants and states.
```

| Field           | Required | Meaning                                                                                 |
| --------------- | -------- | --------------------------------------------------------------------------------------- |
| `description`   | yes      | What the component is, in one or two sentences.                                         |
| `usage`         | yes      | `do`: situations it is for. `avoid`: situations it is not for, with `instead` and `why`. |
| `anatomy`       | yes      | Named parts in reading order, each with a `role` and a `description`.                   |
| `parameters`    | no       | Options, each with a `kind`: `enum`, `boolean`, `string`, or `number`.                  |
| `events`        | no       | What the component reports, by name, with a description.                                |
| `states`        | no       | Interaction and data states, such as `hover`, `disabled`, or `checked`. Order has no meaning. |
| `preferences`   | no       | User preferences the component responds to, with their values.                         |
| `rules`         | no       | Requirements, each with a stable `id`, a `level`, and a `topic`.                        |
| `accessibility` | no       | The role, where the accessible name comes from, and keyboard interaction.               |
| `tokens`        | no       | Which design tokens paint each part. See [Tokens](#tokens).                             |
| `rationale`     | no       | Decisions and why they were made.                                                       |

Anatomy roles are `interactive-surface`, `label`, `description`, `indicator`, and `container`.

An enum parameter lists its `values` with a meaning for each, and may give `examples`: sample
content, such as a label, for each value. A `default` must be one of the values.

An enum parameter may also give `guidance`: for each value, the pattern or guideline section that
says when to choose it. The pairing is explicit, so renaming a heading breaks a link check instead of
silently dropping the guidance.

```yaml
parameters:
  variant:
    kind: enum
    values:
      danger: Destructive or difficult-to-reverse action.
    guidance:
      danger: pattern.action-hierarchy#danger
```

### Rules

A rule is one requirement a design or an implementation must meet.

- `id` is stable within the record. Its address is `<record id>#<rule id>`, such as
  `component.button#label-describes-result`. Review tools and agents cite rules by address.
- `level` is `must`, `should`, or `may`, with the meaning of
  [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).
- `topic` is `content` (words and labels), `behavior` (what happens), or `accessibility`.
- `applicability` says when the rule applies, if not always. `rationale` says why.
- `references` cites records or sections. `examples` gives `do` and `avoid` samples.

### Tokens

`tokens` maps each anatomy part to conditions, and each condition to properties and token
references:

```yaml
tokens:
  <part>:
    <condition>:
      <property>: <token reference>
```

- A **condition** is `base`, a parameter value (`variant.primary`), a state (`hover`), a preference
  value (`reducedMotion.reduce`), or several of those joined with ` + ` (`variant.primary + hover`).
- A **property** is a neutral visual name. Use these where they fit: `background`, `foreground`,
  `border`, `border-width`, `radius`, `gap`, `padding-horizontal`, `padding-vertical`,
  `focus-ring`, `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`,
  `motion`, `motion-duration`, and `motion-easing`. Other lowercase, hyphenated names are allowed.
- A **token reference** is an opaque string that names a token in the adopter's token system. The
  format does not define token names, tiers, or file formats. `transparent` and `none` are allowed
  where no token applies.

The map is reference data. It answers "which token does primary hover use for its background?" It
defines no rule for combining conditions, so it does not compute the final style of a combination.
When a combination matters, write it as its own condition, or explain it in `rationale`.

## Pattern, guideline, and example records

These records are Markdown with YAML front matter. The front matter has the common fields. The
body is the guidance.

```markdown
---
id: pattern.action-hierarchy
type: pattern
title: Action hierarchy
summary: Assign action emphasis by importance, support role, and risk.
tags: [action, hierarchy]
---

Action hierarchy helps a person identify the next action.

## Assign emphasis
```

An example record also has:

- `assets`: images, each with an `id`, a `path` relative to the record file, a `mediaType`,
  `width` and `height` in pixels, and `alt` text.
- `annotations`: callouts, each with an `id`, a `label`, a `description`, and optional
  `references`.

## Links

Links let a reader, human or agent, move from a record to the context around it. Each link has a
kind:

| Kind          | Written on          | Meaning                                              | Inverse          |
| ------------- | ------------------- | ---------------------------------------------------- | ---------------- |
| `alternative` | derived             | Use the target instead in a named situation          | `alternative-to` |
| `composes`    | component           | This component is built from the target component    | `used-in`        |
| `follows`     | any record          | This record applies the target pattern or guideline  | `followed-by`    |
| `example-of`  | example             | This example demonstrates the target                 | `examples`       |
| `related`     | any record          | Worth reading together, with no stronger claim       | `related`        |

Write each link once, on one side. Tools add the inverse, so a component lists its examples
without naming them.

Some links come from fields rather than from `links`:

- `usage.avoid[].instead` with a record ID creates an `alternative` link, and the `situation` and
  `why` travel with it. Any other `instead` text, such as a component that does not exist yet, is
  prose.
- A rule's `references` create a `follows` link to each pattern or guideline they name, and a
  `related` link to anything else.
- An enum parameter's `guidance` creates a `follows` link from the value, such as
  `parameters.variant.danger`, to the section it names. Its inverse, `followed-by`, points back at
  that value: `component.button#parameters.variant.danger`.
- An annotation's `references` create no links. They are checked like any other link.

### Sections

A link target is a record ID, optionally followed by `#` and a section:

- In a Markdown record, a section is a heading's slug: the heading text in lowercase, with
  punctuation removed and spaces replaced by hyphens. `## Assign emphasis` is `assign-emphasis`.
- In a component record, a section is a rule ID, a top-level field (`usage`, `anatomy`,
  `parameters`, `tokens`, and so on), or a dotted path into `anatomy`, `parameters`, or `events`,
  such as `parameters.variant` or `parameters.variant.danger`.
  A parameter value's section holds its meaning with the example and guidance paired with it.
- In an example record, a section is also an annotation ID.

## Cross-record checks

The schema checks each record alone. Tools also check the corpus as a whole:

- Every ID is unique, and each ID's prefix equals its `type`.
- Every link target, `instead` record ID, and reference resolves to a record, and its section, if
  any, exists.
- Rule IDs are unique within a record, and do not collide with a top-level field name.
- An enum parameter's `default`, `examples` keys, and `guidance` keys are among its `values`.
- Every `tokens` part is an anatomy part. Every condition names `base`, a declared state, an enum
  value or boolean (`true` or `false`) of a declared parameter, or a declared preference value.
- An example's asset files exist.

## Versioning

The format version is the number at the end of the schema's `$id`. A change that makes a valid
record invalid, or changes what a field means, increases it.
