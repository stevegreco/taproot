# Rebuild plan: design system spec package

A plan to rebuild the spec package (`packages/spec`) in a new repository. Each work item is one
commit on one branch, reviewed before the next starts. Items are in dependency order.

## Ground rules for the agent

- The spec describes components, not implementations. No element, attribute, framework, CSS, or
  file names in records. Token references are opaque strings: the package never matches on a
  token's name.
- No build step. The library reads the authored files and keeps an index in memory.
- One library, two front ends: a CLI and an MCP server call the same operations. Logic lives in the
  library only.
- The package ships no content of its own. It reads the content folder that `--content` or
  `spec.config.json` names.
- Keep v1 minimal: nothing beyond what an item asks for. Each check lives in one place.
- Node 22+, ESM, pnpm, Vitest. Every item ships with tests and a fixture that proves it.

## Work items

### 1. Define the record format and schema

**As** a design system maintainer, **I want** a written format and a JSON Schema for spec records,
**so that** design and engineering agree on one shape before any tooling exists.

- Write `SPEC.md`: four record types (`component` as YAML, `pattern`, `guideline`, `example` as
  Markdown with front matter), common fields, component fields (usage, anatomy, parameters, events,
  parts, items, states, preferences, rules, accessibility, tokens, rationale), `status`,
  `known-issues`, links, sections, cross-record checks, versioning. `items` holds the parameters
  and events of a part the author repeats, such as each section of an accordion, keyed by that
  anatomy part (ADR 0004). `parts` has the same shape, for a part that appears at most once, such
  as a card's title (ADR 0005). A part is in one or the other, never both. An option that shapes the
  whole component, or more than one part, stays in `parameters`. A token condition names a
  component parameter or state, not a part or item parameter.
- Patterns and guidelines may declare `rules` in front matter, the same shape as a component's
  (ADR 0009). A component inherits the rules of each record in its authored `links.follows`, at
  their own addresses, and does not restate them. A component rule that repeats an inherited id
  narrows it with `extends: <address>` and a `statement` (it keeps the id, topic, level, and
  applicability, may raise the level, and carries no inherited examples, rationale, or references),
  or sets it aside with `waived: <reason>` and no other fields. The schema shares the rule fields
  between the plain and the component rule forms.
- An event that reports a changed value carries the new value, so whoever owns the value can update
  it without reading it back from the component.
- Include a Conventions section: plain rule ids; a requirement every component of a kind shares
  is a rule of the pattern or guideline they follow; shared ids for alike requirements each
  component words itself (`visible-focus`, `forced-colors`, `not-a-control`, `not-color-alone`); `label` vs `accessibleName`; decorative
  graphics; sizes `small`/`medium`/`large`/`inherit`; camelCase parameter names; `checked` vs
  `selected`.
- Leave out anything specific to the old repository: no references to its scripts, docs tests, or
  stylesheet tests. `rationale.covers` names checklist items without saying where the checklist
  lives.
- Write the JSON Schema (`$id` ends in `:record:1`). Unknown fields are an error.

**Done when** valid fixtures for each type pass the schema, and fixtures with a missing required
field, an unknown field, or a bad id prefix fail.

### 2. Load and validate the corpus

**As** an author, **I want** every content error reported with its file, line, and field, and
every reference checked, **so that** I can fix a record without guessing, and renaming a heading or
rule breaks a check instead of silently dropping guidance.

- Discover records anywhere under a content folder: every `*.spec.yaml`, and every `*.md` whose
  front matter has an `id`. Identity is the `id`, not the path.
- Parse YAML keeping line numbers. YAML syntax errors and duplicate keys are issues. Validate each
  record against the schema.
- Sections: Markdown heading slugs with deduplication (`foo`, `foo-1`, `foo-1-1`); in components,
  rule ids, top-level fields, and dotted paths into anatomy, parameters, events, parts, items, and
  enum values, such as `parts.title.parameters.label` or `items.section.parameters.label`;
  annotation ids in examples; rule ids in patterns and guidelines, after the headings. A waived
  rule has no section.
- Cross-record checks from `SPEC.md`: unique ids; resolvable link targets, `instead` ids,
  references, and sections; rule ids unique, a component's not equal to a top-level field name and
  a pattern's or guideline's not equal to a heading slug; a component rule that repeats an
  inherited id has `extends` or `waived`, `extends` names a rule of a followed record with the same
  id and is not weaker, and `waived` names exactly one inherited rule; enum
  `default`/`examples`/`guidance` keys within `values`, for part and item parameters too; part and
  item keys are anatomy parts, and no part is in both; token parts and conditions declared;
  annotation ids unique and not equal to a heading slug; asset files exist and stay inside the
  record's folder; `known-issues` URLs are valid; no text starting with `TODO`.
- `validateSpec()` returns `{ issues, recordCount }`. `loadSpec()` throws a `SpecError` with
  `issues`, or with `skipInvalid: true` leaves out invalid files and lists them in `spec.issues`.
  A link to a record left out this way is itself an issue.
- Port the old package's `test/fixtures/*` one for one (except `token-tier`): one fixture per
  check. The inherited-rule checks share one pattern and component, so their test builds each
  corpus in a temporary folder instead of a fixture folder per check.

**Done when** each check has a failing fixture whose issue names the file, line, JSON pointer, and
message, and `skipInvalid` still serves the valid records.

### 3. Seed content

**As** a contributor, **I want** real content that exercises every part of the format,
**so that** the format is proven on real records before the query layer is built on it.

- Button with every field; minimal drafts of Link, Badge, and Icon, so Button's `instead` and
  `composes` targets exist; Text field, which follows `pattern.form-field` and has no rules of its
  own, so it inherits all of the pattern's; one form control that narrows `form-value` and waives a
  rule it cannot meet; Accordion, whose
  sections carry their own label and expanded state as `items`; Card, whose title carries its own
  label and heading level as `parts`; `pattern.action-hierarchy`, `pattern.form-field`,
  `guideline.compose-or-propose`; and one example with an image asset and annotations.
  `pattern.form-field` carries the shared form rules, and its body explains only what rules cannot
  say, without restating them.
- Give records `tags` with the words people search by when those differ from the title, such as
  `dropdown` or `destructive`. No new field: search already weights tags.
- Fix the format or the checks in this commit wherever real content shows a gap.

**Done when** `validateSpec()` passes on the seed, and the seed uses every field that produces a
link (`links` with each kind, `usage.avoid[].instead`, rule `references`, enum `guidance`) and
every section kind.

### 4. Link graph

**As** a reader or agent, **I want** to move from any record to the records around it,
**so that** I find the alternative, the pattern it follows, and its examples without searching.

- Explicit `links` (`composes`, `follows`, `example-of`, `related`) plus derived links:
  `usage.avoid[].instead` → `alternative` (carrying `situation` and `why`); rule `references` →
  `follows` or `related`; enum `guidance` → `follows` from the value's section, for a component,
  part, or item parameter.
- Add inverses automatically (`alternative-to`, `used-in`, `followed-by`, `examples`, `related`).
- Enforce which record types each kind may go from and to.

**Done when** `links(id, { kind, direction })` returns every link kind on the seed, derived and
inverse, and a link of the wrong type fails validation.

### 5. Query and render library

**As** a tool author, **I want** one library API over the corpus,
**so that** the CLI and MCP server never re-implement queries.

- `list({ type, tag, status })`: summaries sorted by id.
- `get(id)`: the whole record, frozen.
- `section("id#section")`: a heading, rule, field, or annotation. An enum value's section is
  `{ meaning, example?, guidance? }`.
- `search(query, { type, tags, limit })`: weighted fields (title > tags > id > summary > body),
  simple stemming, stop words, typo tolerance for single words, prefix matches; drop hits under a
  quarter of the top score, and mark hits `weak` when the best one matched no name, title, or tag.
- `links(id, { kind, direction })`: `out` (the default) lists links from the record, inverses
  included; `in` lists links to it; `both` merges them without duplicates.
- `rules({ id, topic, level, query })`: addresses such as `component.button#visible-focus`, `must`
  first, with each rule's applicability. Filtered to a component, it adds the rules the component
  inherits, at the address where each is written (such as `pattern.form-field#error-blocks-submit`,
  with `appliesTo` naming the component), replaces each narrowed rule with the component's (with
  `extends`), and leaves out waived ones. Unfiltered, each rule appears once, under its record.
- `tokens(id, { part, condition, property })`, with values when a `resolveToken` function was
  passed to `loadSpec`.
- `render(target)`: Markdown for a record or a section, with draft/deprecated notes and known issues
  under the summary. A component's rules include inherited ones by address, narrowed ones with
  the rule they extend, and a Waived list with reasons; a pattern's or guideline's rules follow its
  body. Throws on an unknown record or section.
- Package exports: `.` (the library), `./config`, `./tokens-dtcg`, `./implementation`, and the
  schema.

**Done when** each operation and filter is tested against the seed and fixtures, a search for
`input` (a tag on Text field, not in its title) returns `component.text-field` first, and returned
records are frozen.

### 6. Config and token resolution

**As** an adopter, **I want** to point the package at my content and token sets in one config file,
**so that** it works in any repository.

- `spec.config.json`, found by walking up from the working directory: `content`, `implementations`
  (a name → `{ folder, technology }`, such as `web` → `{ folder: "packages/components/implementation",
  technology: "web-component" }`), and `tokens`
  (`format: dtcg`, named sets such as `light` and `dark`, later files win), `constants` (the
  token that holds each system-wide constant, such as `border-width` or `focus-ring-width`), and
  `vocabulary` (each concept, such as `size` or `status`, with its `values`, an optional
  `parameter` name limited to them, and `aliases` mapping other words to the value to use). Paths
  are relative to the config file.
- The content folder comes from `--content`, then the config. With neither, fail with a message
  that says how to set one.
- A DTCG resolver that follows `{alias}` references, detects alias cycles, stringifies values
  (`{ value: 16, unit: "px" }` becomes `16px`), and returns a value per set. Token files are read
  only when values are requested, or by `validate`.
- `validate` checks every token reference: a keyword (`transparent`, `none`, `inherit`, `linear`)
  or a token present in every configured set. Each constant's token must be in every set too.
- With a `vocabulary`, `validate` reports an enum value outside its concept's values for a parameter
  named by the concept, and any enum value that is an alias, naming the value to use.

**Done when** a fixture resolves a reference to light and dark values, an unknown reference or
constant fails `validate`, and an alias cycle reports an issue instead of hanging.

### 7. Implementation files

**As** an engineer or agent, **I want** a per-technology file that maps a component's parameters and
events to its real API, **so that** I use the right attribute names instead of guessing them from
parameter names.

- The files live with the implementation, such as `packages/components/implementation/<name>.md`,
  not in the spec content. The spec package only reads the folders the config names, and never
  requires a file to exist. Whether a finished component must have one is for the implementation's
  own tests.
- Format: Markdown with front matter: `component` (record id), `package`, `usage`, and `api` rows
  (`name`, `kind`, the `parameter` or `event` it implements, and `values` when value names
  differ), `parts` and `items` (below), plus a body of technology-only guidance.
- `parts` lists each record part with its `api` rows. A part with no name field is set on the
  component itself, as a web Card sets `label` on its own element. A part with one is its own
  element or component, as a compound React API would give `CardTitle`. The spec never says which.
- `items` lists each record item with what realizes it and its `api` rows: an element for a web
  component, which may be a native one such as `option`; for React, an exported component, or an
  entry of an array prop (`prop: options`), whose rows are that entry's fields.
- The `technology` in the config decides the fields that name the component and the allowed row
  kinds. One table in the library defines each technology, so adding one is a table entry:
  - `web-component`: `tagName` and `defineExport`; rows are `attribute`, `property`, or `event`.
  - `react`: `export`; rows are `prop` or `callback`, or `field` for an entry of an array prop.
  A file is checked against its folder's technology, and an unknown technology fails config
  validation.
- Check each file that exists against its record: the component exists; every mapped parameter,
  value, and event exists; and every parameter and event of the record has a row. The same holds
  for each part and item, and every record part and item has an entry. `validate`
  runs these checks for each configured folder, and `get` with that implementation fails with the
  same issues.
- `get` with an implementation appends the rendered file: package, usage, and an API table whose
  descriptions come from the record, followed by one table per part and item. Implements cells name
  the owner, such as "section parameter `value`". Under a table with an empty Implements cell, a
  line says the row is specific to the implementation.

- A configured folder that does not exist means nothing is implemented in it, not an error.

**Done when** a mapping to a missing parameter, or a record, part, or item parameter with no row,
fails `validate`, a component with no file passes, a missing folder passes, a field or row kind from
the wrong technology fails, a part maps both with and without its own element, an item maps to a
native element and to an array prop, and `get` renders the API tables for a fixture folder of each
technology outside the spec content.

### 8. CLI

**As** a person or agent, **I want** to query the spec from a terminal,
**so that** I can read and check it without writing code.

- One operations layer, shared with the MCP server: id resolution (plain names, `#section`, unique
  prefix, single-word typos, short paths such as `items.section.value` when only one parameter or
  event matches), filter values checked against the valid ones, issue formatting, and
  results as `{ text, data, ok, error? }`.
- Errors carry a code and suggestions, `{ code, suggestions }`: `ERR_UNKNOWN_RECORD`,
  `ERR_UNKNOWN_SECTION`, `ERR_UNKNOWN_IMPLEMENTATION`, `ERR_NO_IMPLEMENTATION`, and
  `ERR_INVALID_IMPLEMENTATION`. An unknown section suggests the sections whose path ends in the
  name asked for, so `#title` suggests `#anatomy.title` and `#parts.title`.
- `ds-spec`: `list [--impl <name>]`, `search`, `get [--impl <name>]`, `links`, `rules`,
  `tokens [--part] [--condition] [--property] [--resolve]`, `format [--resolve]`, `batch`,
  `validate`, `help [command]`, and `help agents`. Global flags `--content`, `--config`, and
  `--json`. `list --impl` lists the components that implementation has.
- `format` prints what an implementer needs from `SPEC.md` and cannot get from a record: the binding
  property names, token keywords, condition syntax, anatomy roles, and the system-wide constants
  with their tokens. `--resolve` adds each constant's value per set. Agents read the spec only
  through the tools, so format decisions they cannot reach get guessed. A test keeps `SPEC.md`'s
  property list equal to the one `format` prints.
- `batch` runs several commands in one call and loads the corpus once, such as
  `ds-spec batch --command "get button --impl web" --command "tokens button --resolve"`. Each
  `--command` string is split into arguments the way a shell would (quotes group words; no
  variables or globs). It returns one result per command, in order, and with `--json` an array of
  results. A failed command does not stop the others; the exit code is the highest of the
  commands' exit codes. Each separate call costs an agent a round trip, so this is the cheapest way
  to answer a task that needs several lookups.
- Output details: each search result names the command that reads it; a weak search starts with
  "No strong match" and marks weak hits; `get` on a component ends with lines naming its
  implementations and its token count instead of printing the token table; `rules` prints each
  rule's applicability and marks a narrowed rule `(extends <address>)`; a section read starts with its path, such as `parameters.headingLevel`;
  parts and items lead with "Options of the `title` part." and "Options of each `section`.";
  `tokens` notes under a non-base condition that the base bindings still apply; stray positional
  words get a hint to quote a value of several words. Hints name every configured implementation
  equally, never one first.
- Exit codes: 0 ok, 1 issues, empty result, or unknown id or section, 2 usage error. Commands other
  than `validate` skip broken records and say so on stderr.

- A benchmark script (`pnpm bench`, not part of `pnpm test`) reports how long `ds-spec get button`
  takes on the seed. The target is under 300 ms on a developer machine.

- CLI tests use their own fixture config, never the repository's `spec.config.json`.

**Done when** each command and error code has a test, `batch` returns the same results as the
separate commands and the exit code of its worst one, `ds-spec get button` finishes in under 1 s in
a test, and `ds-spec validate` passes on the seed.

### 9. MCP server

**As** an agent, **I want** the same queries as MCP tools and resources,
**so that** I read the spec the same way a person does.

- `ds-spec-mcp` (stdio): one tool per CLI command except `help` and `batch` (MCP clients already
  call several tools in one turn), each calling the shared operations layer. A tool's `structuredContent` is the CLI's `--json` output, and a failure puts
  `{ code, suggestions }` in `structuredContent.error`.
- Each record as a `spec://<id>` resource.
- Agent instructions live once in the library: search, get, follow links, cite rules by address
  (a component's include those it inherits, at their own addresses), use `format` for what records do not repeat, read the implementation before writing code, and use
  `batch` (CLI) or parallel tool calls (MCP) for several lookups. They tell agents to use the CLI when they have a terminal and the MCP server
  when they don't, and to run the CLI from an installed copy (a workspace or project dependency),
  never an `npx` download per call. The server sends them as its instructions, and
  `ds-spec help agents` prints them for an `AGENTS.md` or skill file.
- Content is loaded at start. Restart the server to pick up changes.

**Done when** for the same query, each tool's `structuredContent` equals the CLI's `--json`
output, and the server instructions equal `ds-spec help agents` output.

### 10. Agent evaluation

**As** a maintainer, **I want** to see whether the spec tools actually help an agent build UI,
**so that** changes to the tools and content are judged by agent results, not only unit tests.

- Five to ten real UI tasks on the seed components, such as "a settings form with Save, Cancel,
  and Delete account". There are no components to build with yet, so each task asks for a JSON
  answer, not code: the components chosen, their parameter values and visible labels, and the
  rule addresses the design follows. Tasks and their expected answers live in `eval/tasks/`.
- Grade each answer automatically: the right components and variants, labels that pass the `must`
  content rules a script can check, and no `must` rule broken.
- A script runs each task with a headless agent CLI (such as `claude -p`) in a temporary copy of
  the repository, with the same model under three conditions: CLI, MCP server, and no spec tools.
  Record pass rate, time, tokens, and tool calls.
- Keep the full transcripts and read them. Note where an agent skipped the tools, read source
  files instead, re-read help, or made several calls that `batch` could have combined.
- Not part of `pnpm test`: it runs on request and writes a dated report.

**Done when** one run's report lists the metrics for all three conditions and the transcript
findings, and each finding is fixed or filed.

## Out of scope

Writing the implementation files themselves (they ship with the components), grading agents on
generated code (item 10 grades spec choices until components exist), the rule that a
finished component must have one, checks on token tiers (they belong to the tokens package), MCP
auto-reload, the component authoring scripts and skills, the components, the tokens package, the
docs site, and Storybook.
