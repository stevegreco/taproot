# Design system spec format

**Version:** 1 (`urn:taproot:record:1`)

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
| `status`  | no       | `draft`, `stable`, or `deprecated`. Defaults to `stable`. See [Status](#status). |
| `links`   | no       | Typed links to other records. See [Links](#links).                               |
| `sources` | no       | Provenance: `{ title, url }` pairs naming where the record came from.            |
| `known-issues` | no  | Open problems: a `statement`, and an optional `issue` URL. See [Known issues](#known-issues). |

A name is lowercase letters and digits in words joined by hyphens. A name inside an ID may have
more than one dotted segment, such as `example.action-hierarchy.settings`.

### Status

A component starts as a `draft`: a record with only the required fields (`id`, `type`, `title`,
`summary`, `description`, `usage`, and `anatomy`) that says what the component is for, so it can be
reviewed before anyone builds it. A draft has no implementation, and `get` says so. Removing
`status: draft` is part of the change that ships the first implementation.

### Known issues

`rationale` is permanent: it says why a decision was made. A problem waiting on a fix is not a
decision, so it goes in `known-issues` instead, as a short `statement`. Add the URL of the `issue`
that tracks the fix when there is one. `get` shows each entry under the summary, so readers meet it
before building on the record.

```yaml
known-issues:
  - statement: Link text measures 4.32:1 on the light info surface, below the 4.5:1 minimum.
    issue: https://github.com/stevegreco/taproot/issues/183
```

Remove the entry in the change that fixes the problem.

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
      destructive: Destructive or difficult-to-reverse action.
    examples:
      primary: Save changes
      destructive: Delete project
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
      radius: semantic.radius.control
    variant.primary:
      background: semantic.color.background.action.primary.default
    variant.primary + hover:
      background: semantic.color.background.action.primary.hover
    reducedMotion.reduce:
      motion: none

rationale:
  - decision: Button reads semantic tokens directly.
    why: A component token namespace would only restate the semantic tier.
```

| Field           | Required | Meaning                                                                                 |
| --------------- | -------- | --------------------------------------------------------------------------------------- |
| `description`   | yes      | What the component is, in one or two sentences.                                         |
| `usage`         | yes      | `do`: situations it is for. `avoid`: situations it is not for, with `instead` and `why`. |
| `anatomy`       | yes      | Named parts in reading order, each with a `role` and a `description`.                   |
| `parameters`    | no       | Options, each with a `kind`: `enum`, `boolean`, `string`, or `number`.                  |
| `events`        | no       | What the component reports, by name, with a description.                                |
| `parts`         | no       | Parts that appear once and have options of their own, with those parameters and events. See [Parts](#parts). |
| `items`         | no       | Parts the author repeats, with the parameters and events each copy has. See [Items](#items). |
| `states`        | no       | Interaction and data states, such as `hover`, `disabled`, or `checked`. Order has no meaning. |
| `preferences`   | no       | User preferences the component responds to, with their values.                         |
| `rules`         | no       | Requirements, each with a stable `id`, a `level`, and a `topic`. See [Rules](#rules).   |
| `accessibility` | no       | The role, where the accessible name comes from, and keyboard interaction.               |
| `tokens`        | no       | Which design tokens paint each part. See [Tokens](#tokens).                             |
| `rationale`     | no       | Decisions and why they were made. `covers` optionally names the checklist items a decision settles, such as `loading`. The adopter defines the checklist. |

Anatomy roles are `interactive-surface`, `label`, `description`, `indicator`, and `container`.

An event that reports a changed value, such as `input`, `change`, or a section's `toggle`, carries
the new value, so whoever owns the value can update it without reading it back from the component.

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
      destructive: Destructive or difficult-to-reverse action.
    guidance:
      destructive: pattern.action-hierarchy#destructive
```

### Parts

Some options shape one part that appears at most once, such as a card's title. `parts` lists them,
keyed by that anatomy part, with its `parameters` and `events`. They take the same shape as the
component's own, and the same checks apply. Options that shape the whole component, or more than
one part, stay in the component's `parameters`.

```yaml
anatomy:
  title:
    role: label
    description: Names the subject.

parts:
  title:
    parameters:
      label:
        kind: string
        description: Text of the title.
      headingLevel:
        kind: number
        default: 3
```

`parts` says which part an option belongs to, not how an implementation exposes it. One
implementation may set it on the component, another on a separate child for the part.

### Items

Some components are built from a part the author repeats: each section of an accordion, each panel
of a set of tabs. Each copy carries its own options, such as its label. `items` lists them, keyed
by the anatomy part that repeats, with the `parameters` and `events` each copy has. Both take the
same shape as the component's own, and the same checks apply.

```yaml
anatomy:
  section:
    role: container
    description: One heading and its content, stacked with the other sections.
  trigger: ...

items:
  section:
    parameters:
      label:
        kind: string
        description: Visible text of the section's trigger.
      expanded:
        kind: boolean
        description: Whether the section's content is shown.
        default: false
```

For both `parts` and `items`, the anatomy part still says what the part is. A part is in one or the
other, never both. States, rules, accessibility, and tokens describe the whole component. A token
condition names a component parameter or state, not a part or item parameter, so a part or item
option that changes how it looks has a matching state, such as `expanded`.

### Rules

A rule is one requirement a design or an implementation must meet.

- `id` is stable within the record. Its address is `<record id>#<rule id>`, such as
  `component.button#label-describes-result`. Review tools and agents cite rules by address.
- `level` is `must`, `should`, or `may`, with the meaning of
  [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).
- `topic` is `content` (words and labels), `behavior` (what happens), or `accessibility`.
- `applicability` says when the rule applies, if not always. `rationale` says why.
- `references` cites records or sections. `examples` gives `do` and `avoid` samples.

#### Inherited rules

A requirement shared by several components is written once, as a rule of a pattern or guideline
(see [Pattern, guideline, and example records](#pattern-guideline-and-example-records)). A component
inherits the rules of each record in its `links.follows`, at their own addresses, such as
`pattern.form-field#error-blocks-submit`. It does not restate them. Its own `rules` hold what is
true of it alone, and may change an inherited rule in one of two ways, by repeating its `id`:

- **Narrow it** with `extends`, the inherited rule's address, and a `statement` that says what the
  rule means for this component. The rule keeps its `id`, `topic`, and `level`, and its
  `applicability` unless it gives its own. It may raise the `level`, never lower it. Examples,
  rationale, and references describe the inherited statement, so they do not carry over. Its address is the component's: `component.switch#form-value`.
- **Waive it** with `waived`: why the rule cannot apply, such as a requirement about an option the
  component does not have. A waived rule has no other fields. Add `extends` only when two followed
  records have a rule with that `id`.

```yaml
links:
  follows: [pattern.form-field]
rules:
  - id: form-value
    extends: pattern.form-field#form-value
    statement: The value submits only while the switch is on. Reset restores the initial state.
  - id: required-blocks-submit
    waived: A switch is always on or off, so it has no required option.
```

A component's rules, as `rules` and `get` show them, are its own, then each inherited rule it does
not narrow or waive. Review against all of them.

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
  `motion`, `motion-duration`, `motion-easing`, `shadow`, `size`, `height`, and `track` (the
  unfilled path behind an indicator). Other lowercase, hyphenated names are allowed.
- A **token reference** is an opaque string that names a token in the adopter's token system. The
  format does not define token names, tiers, or file formats. Where no token applies, these values
  are allowed: `transparent`, `none`, `inherit` (the value comes from the surrounding content), and
  `linear` (for `motion-easing`).
- System-wide constants, such as border width and focus-ring width and offset, are the same for
  every component, so a component map does not have to list them. The adopter names each constant
  and the token that holds it in `constants` in `spec.config.json`, and `taproot format` serves
  them with the property names and keywords above.

The map is reference data. It answers "which token does primary hover use for its background?" It
defines no rule for combining conditions, so it does not compute the final style of a combination.
When a combination matters, write it as its own condition, or explain it in `rationale`.

## Pattern, guideline, and example records

These records are Markdown with YAML front matter. The front matter has the common fields. The
body is the guidance.

A pattern or guideline may also have `rules`, the same shape as a component's. Components that
follow it inherit them (see [Inherited rules](#inherited-rules)). Write a requirement there when
every component that follows the record must meet it, and keep the body for the explanation and
examples people read.

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

## Conventions

Records follow these so that one idea has one name everywhere.

- **Rule ids** name the requirement in plain words, with no topic prefix, because `topic` already
  says `accessibility`. A requirement every component of a kind shares is a rule of the pattern or
  guideline they follow, such as `pattern.form-field`. Requirements that are alike but that each
  component words for itself use shared ids: `visible-focus`, `forced-colors`,
  `not-a-control`, and `not-color-alone`.
- **Form fields** follow `pattern.form-field` and inherit its rules for label, hint, error,
  required, disabled, form value, and focus. Each keeps only the rules about its own control, and
  narrows `form-value` to say what its value is.
- **`label`** is visible text that names the component, and it is also the accessible name. A name
  that is not shown is **`accessibleName`**.
- **Decorative:** a graphic with no `accessibleName` is decorative and hidden from assistive
  technology. A component that uses its name for something else, as Avatar shows initials, takes a
  `decorative` boolean instead.
- **Sizes** are `small`, `medium`, and `large`, plus `inherit` to match the surrounding text.
- **Parameter names** are camelCase, such as `fullWidth` and `headingLevel`. A destination URL is
  `href`.
- **States:** `checked` is for a form choice, and `selected` is for choosing what is shown, as in
  Tabs.

## Links

Links let a reader, human or agent, move from a record to the context around it. Each link has a
kind:

| Kind          | Written on          | Meaning                                              | Inverse          |
| ------------- | ------------------- | ---------------------------------------------------- | ---------------- |
| `alternative` | derived             | Use the target instead in a named situation          | `alternative-to` |
| `composes`    | component           | This component is built from the target component    | `used-in`        |
| `follows`     | any record          | This record applies the target pattern or guideline  | `followed-by`    |
| `example-of`  | example             | This example demonstrates the target component, pattern, or guideline | `examples` |
| `related`     | any record          | Worth reading together, with no stronger claim       | `related`        |

Write each link once, on one side. Tools add the inverse, so a component lists its examples
without naming them. A `composes` link goes from a component to a component, a `follows` link
points at a pattern or a guideline, and an `example-of` link goes from an example to a component,
pattern, or guideline. `related` links any two records.

Some links come from fields rather than from `links`:

- `usage.avoid[].instead` with a record ID creates an `alternative` link, and the `situation` and
  `why` travel with it. Any other `instead` text, such as a component that does not exist yet, is
  prose.
- A rule's `references` create a `follows` link to each pattern or guideline they name, and a
  `related` link to anything else.
- An enum parameter's `guidance` creates a `follows` link from the value, such as
  `parameters.variant.destructive` or `items.section.parameters.tone.quiet`, to the section it names. Its inverse, `followed-by`, points back at
  that value: `component.button#parameters.variant.destructive`.
- An annotation's `references` create no links. They are checked like any other link.

### Sections

A link target is a record ID, optionally followed by `#` and a section:

- In a Markdown record, a section is a heading's slug: the heading text in lowercase, with
  punctuation removed and spaces replaced by hyphens. `## Assign emphasis` is `assign-emphasis`.
  Every heading has its own slug. A slug an earlier heading already has gets `-1`, `-2`, and so on,
  skipping any an earlier heading took, so headings `Foo`, `Foo`, and `Foo-1` are `foo`, `foo-1`,
  and `foo-1-1`. A pattern's or guideline's rule ID is also a section, and must not repeat a
  heading's slug.
- In a component record, a section is a rule ID, a top-level field (`usage`, `anatomy`,
  `parameters`, `tokens`, and so on), or a dotted path into `anatomy`, `parameters`, `events`,
  `parts`, or `items`, such as `parameters.variant`, `parameters.variant.destructive`,
  `parts.title.parameters.label`, or `items.section.parameters.label`.
  A parameter value's section holds its meaning with the example and guidance paired with it.
- In an example record, a section is also an annotation ID. It must not repeat another annotation
  ID or a heading's slug.

## Cross-record checks

The schema checks each record alone. Tools also check the corpus as a whole:

- Every ID is unique, and each ID's prefix equals its `type`.
- Every link target, `instead` record ID, and reference resolves to a record, and its section, if
  any, exists.
- Each `links` kind is written on a record type it describes and points at a record type it allows:
  see [Links](#links). An enum parameter's `guidance` points at a pattern or a guideline.
- Annotation IDs are unique within an example, and none is also a heading's slug.
- Rule IDs are unique within a record. A component's rule ID does not collide with a top-level
  field name, and a pattern's or guideline's does not collide with a heading's slug.
- A component rule that repeats the ID of a rule it inherits narrows it with `extends` or sets it
  aside with `waived`. `extends` names a rule of a record the component follows, with the same ID,
  and does not lower its level. `waived` names exactly one inherited rule.
- An enum parameter's `default`, `examples` keys, and `guidance` keys are among its `values`. This
  holds for part and item parameters too.
- Every `parts` and `items` key is an anatomy part, and no part is in both.
- Every `tokens` part is an anatomy part. Every condition names `base`, a declared state, an enum
  value or boolean (`true` or `false`) of a declared parameter, or a declared preference value.
- Every token reference is one of the keywords `transparent`, `none`, `inherit`, or `linear`, or
  names a token in every set that `spec.config.json` configures.
- An example's asset files exist.
- No text value starts with `TODO`. Scaffolded drafts use `TODO:` for text the author has not
  written yet.

## Versioning

The format version is the number at the end of the schema's `$id`. A change that makes a valid
record invalid, or changes what a field means, increases it.
