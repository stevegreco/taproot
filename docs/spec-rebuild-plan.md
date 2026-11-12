# Rebuild plan: design system spec package

A plan to rebuild the spec package as it works today, in a new repository. The reference is
`packages/spec` in this repository: where the plan gives no detail, such as the shape of a field or
a fixture's contents, follow what is there. The ADRs it cites are in `docs/adr/`. Each work item is
one commit on one branch, reviewed before the next starts. Items are in dependency order.

## Ground rules for the agent

- The spec describes components, not implementations. No element, attribute, framework, or CSS
  names in records, and no file names except an example's own assets. Token references are opaque
  strings: the library never matches on a token's name.
- No build step. The library reads the authored files and keeps an index in memory. The one
  exception is the snapshot for hosted deploys (item 10).
- One library, with front ends over it: a CLI and an MCP server call the same operations. Logic
  lives in the library only.
- The package ships its `content` folder and reads it when neither `--content` nor
  `spec.config.json` names another folder.
- Keep the rebuild to what the reference does: nothing beyond what an item asks for. Each check
  lives in one place.
- Node 22.12+, ESM, pnpm, Vitest. Every item ships with tests and a fixture that proves it.

## Work items

### 1. Define the record format and schema

**As** a design system maintainer, **I want** a written format and a JSON Schema for spec records,
**so that** design and engineering agree on one shape before any tooling exists.

- Set up the package as `@taproot-ds/spec`, with the reference's folder layout: `bin`,
  `src`, `content`, `scripts`, `test`, and `SPEC.md`. It publishes `bin`, `src`, `content`,
  `SPEC.md`, and `README.md`.
- Bring over `SPEC.md`: four record types (`component` as YAML, `pattern`, `guideline`, `example` as
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
- Include its Conventions section: plain rule ids; a requirement every component of a kind shares
  is a rule of the pattern or guideline they follow; shared ids for alike requirements each
  component words itself (`visible-focus`, `forced-colors`, `not-a-control`, `not-color-alone`);
  form fields following `pattern.form-field`;
  `label` vs `accessibleName`; decorative graphics; sizes `small`/`medium`/`large`/`inherit`;
  camelCase parameter names and `href`; `checked` vs `selected`.
- `rationale.covers` names checklist items. The adopter defines the checklist.
- Bring over the JSON Schema (`$id` ends in `:record:1`). Unknown fields are an error.

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
- Cross-record checks: unique ids; resolvable link targets, `instead` ids, references, and sections;
  rule ids unique, a component's not equal to a top-level field name and a pattern's or guideline's
  not equal to a heading slug; a component rule that repeats an inherited id has `extends` or
  `waived`, `extends` names a rule of a followed record with the same id and is not weaker, and
  `waived` names exactly one inherited rule; enum `default`/`examples`/`guidance` keys within
  `values`, for part and item parameters too; `guidance` points at a pattern or guideline; part and
  item keys are anatomy parts, and no part is in both; token parts and conditions declared;
  annotation ids unique and not equal to a heading slug; asset files exist and stay inside the
  record's folder; `known-issues` URLs are valid; no `TODO:` placeholder text.
- Some issues do not make a record wrong, and carry a `kind`: `placeholder` for a `TODO:` value a
  draft has not replaced yet, and `dependency` for a link to a record that is itself invalid.
- `validateSpec()` returns `{ issues, recordCount }`. `loadSpec()` throws a `SpecError` with
  `issues`. With `skipInvalid: true` it leaves out each file with an issue that has no `kind`, and
  lists those files' issues in `spec.issues`. A record whose only issues have a `kind` still loads:
  placeholders mark it `unfinished` with their pointers, and `spec.gaps(id)` names the left-out
  records it links to, the followed ones among them whose rules are absent, and its own rules that
  narrow a rule of a left-out record.
- Bring over the reference's `test/fixtures/*` for these checks, one fixture per check. The
  inherited-rule checks share one pattern and component, so their test builds each corpus in a
  temporary folder instead of a fixture folder per check.

**Done when** each check has a failing fixture whose issue names the file, line, JSON pointer, and
message, `skipInvalid` still serves the valid records, and a draft with only placeholders loads as
`unfinished`.

### 3. Content

**As** a contributor, **I want** the real content in place, **so that** the format is proven on real
records before the query layer is built on it.

- Bring over the reference's `content` folder, with its `tags`: the words people search by when
  those differ from the title, such as `dropdown` or `destructive`. Search weights tags (item 5).
- Fix the format or the checks in this commit wherever real content shows a gap.

**Done when** `validateSpec()` passes on the content, and the content uses every field that produces
a link (`links` with each kind, `usage.avoid[].instead`, rule `references`, enum `guidance`) and
every section kind.

### 4. Link graph

**As** a reader or agent, **I want** to move from any record to the records around it,
**so that** I find the alternative, the pattern it follows, and its examples without searching.

- Explicit `links` (`composes`, `follows`, `example-of`, `related`) plus derived links:
  `usage.avoid[].instead` → `alternative` (carrying `situation` and `why`); rule `references` →
  `follows` for a pattern or guideline, `related` for anything else; enum `guidance` → `follows`
  from the value's section, for a component, part, or item parameter.
- Add inverses automatically (`alternative-to`, `used-in`, `followed-by`, `examples`, `related`).
- Enforce which record types each kind may go from and to, as `SPEC.md`'s Links section lists them.
- `links(id, { kind, direction })`: `out` (the default) lists links from the record, inverses
  included; `in` lists links to it, under the kind the source record states; `both` merges them
  without duplicates. Link says to use Button instead in a situation, so `links` on Button lists
  Link as `alternative-to` with `out`, and as `alternative` with `in`.

**Done when** `links()` returns every link kind on the content, derived and inverse, and a link of
the wrong type fails validation.

### 5. Query and render library

**As** a tool author, **I want** one library API over the corpus,
**so that** the CLI and MCP server never re-implement queries.

- `list({ type, tag, status })`: summaries sorted by id.
- `get(id)`: the whole record, frozen.
- `section("id#section")`: a heading, rule, field, or annotation. An enum value's section is
  `{ meaning, example?, guidance? }`.
- `search(query, { type, tags, limit })`: weighted fields (title > tags > id > summary > body),
  simple stemming, stop words, typo tolerance for single words, prefix matches; drop hits under a
  quarter of the top score.
- `rules({ id, topic, level, query })`: addresses such as `component.button#visible-focus`, `must`
  first, with each rule's applicability. Filtered to a component, it adds the rules the component
  inherits, at the address where each is written (such as `pattern.form-field#error-blocks-submit`,
  with `appliesTo` naming the component), replaces each narrowed rule with the component's (with
  `extends`), and leaves out waived ones. Unfiltered, each rule appears once, under its record.
- `tokens(id, { part, condition, property })`, with values when a `resolveToken` function was
  passed to `loadSpec`.
- `render(target)`: Markdown for a record or a section, with draft/deprecated notes and known issues
  under the summary. A component's rules include inherited ones by address, narrowed ones with the
  rule they extend, and a Waived list with reasons; a pattern's or guideline's rules follow its
  body. A record loaded with gaps says which fields are unfinished and which linked records are
  missing. Throws on an unknown record or section.
- Package exports: `.` (the library, with the default content folder), the schema as
  `./schema/spec-record.json`, `./SPEC.md`, and `./package.json`.

**Done when** each operation and filter is tested against the content and fixtures, a search for
`dropdown` (a tag on Select, not in its title) returns `component.select` first, and returned
records are frozen.

### 6. Config and token resolution

**As** an adopter, **I want** to point the package at my content and token sets in one config file,
**so that** it works in any repository.

- `spec.config.json`, found by walking up from the working directory: `content`, `implementations`
  (a name → `{ folder, technology }`, such as `web` →
  `{ folder: "packages/components/implementation", technology: "web-component" }`), `tokens`
  (`format: dtcg`, named sets such as `light` and `dark`, later files win), `constants` (the token
  that holds each system-wide constant, such as `border-width` or `focus-ring-width`), and
  `vocabulary` (each concept, such as `size` or `status`, with its `values`, an optional
  `parameter` name limited to them, and `aliases` mapping other words to the value to use). Paths
  are relative to the config file.
- The content folder comes from `--content`, then the config, then the package's own `content`.
- A DTCG resolver that follows `{alias}` references, stringifies values (`{ value: 16, unit: "px" }`
  becomes `16px`), and returns a value per set. An alias cycle throws an error naming the cycle.
  Token files are read only when values are requested, or by `validate`.
- With token sets configured, `validate` checks every token reference: a keyword (`transparent`,
  `none`, `inherit`, `linear`) or a token present in every set. Each constant's token must be in
  every set too. `validate` reads token names only, so it does not resolve aliases.
- With a `vocabulary`, `validate` reports an enum value outside its concept's values for a parameter
  named by the concept, and any enum value that is an alias, naming the value to use.
- `checkFromConfig` runs every check in one place: the records, token references, vocabulary, the
  constants' tokens, and, from item 7, the implementation files. `validate` and the snapshot build
  (item 10) both call it, so they agree on what is valid.
- Tests of the package's own content check that its references pass with the repository's config,
  and that no component takes a color, radius, or border from a primitive token. The token check
  reads the token files that config names, so those files must be in the repository.
- Add the exports `./config` and `./tokens-dtcg`.

**Done when** a fixture resolves a reference to light and dark values, an unknown reference or
constant fails `validate`, an enum value outside the vocabulary fails `validate` with its file and
line, an alias cycle throws instead of hanging, and with no config or flag the package's own content
loads.

### 7. Implementation files

**As** an engineer or agent, **I want** a per-technology file that maps a component's parameters and
events to its real API, **so that** I use the right attribute names instead of guessing them from
parameter names.

- The files live with the implementation, such as `packages/components/implementation/<name>.md`,
  not in the spec content. The library only reads the folders the config names, and never requires
  a file to exist. A configured folder that does not exist means nothing is implemented in it, not
  an error.
- Format: Markdown with front matter: `component` (record id), `package`, `usage`, and `api` rows
  (`name`, `kind`, the `parameter` or `event` it implements, and `values` when value names
  differ), `parts` and `items` (below), plus a body of technology-only guidance. A row that
  implements no parameter needs its own `type` and `description`, and an event row that implements
  no event needs its own `description`. The file is named after the component, such as `button.md`.
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
- `loadImplementations` reads a folder, and `checkImplementation` checks each file that exists
  against its record: the component exists; the file name matches it; every mapped parameter, value,
  and event exists; and every parameter and event of the record has a row. The same holds for each
  part and item, and every record part and item has an entry. `checkFromConfig` runs these checks
  for each configured folder, but only when the content is the folder the config names: other
  content is other records.
- A folder may hold a `README.md` with the setup every component of that implementation shares:
  installing the package, loading its styles, and fonts (ADR 0010). It is not an implementation
  file. `readSetup` returns its Markdown, or nothing when there is none.
- `renderImplementation` renders a file: package, what names the component (its element or export),
  an import block (for the web, `<package>/<file name>`), usage, an API table whose descriptions
  come from the record, one table per part and item, and the guidance body. Implements cells name
  the owner, such as "section parameter `value`". Under a table with an empty Implements cell, a
  line says the row is specific to the implementation.
- Tests of the package's own content run `checkImplementation` over every configured folder, and
  require a file in at least one folder for each component that is not a draft, and no file for a
  draft. They read the folders the repository's config names, so those folders must be in the
  repository.
- Add the export `./implementation`.

**Done when** a mapping to a missing parameter, or a record, part, or item parameter with no row,
fails `checkImplementation` and `validate`, a missing folder loads as empty, a folder's `README.md`
reads as its setup, a field or row kind from the wrong
technology fails, a part maps both with and without its own element, an item maps to a native
element and to an array prop, and `renderImplementation` produces the tables for each technology.

### 8. CLI

**As** a person or agent, **I want** to query the spec from a terminal,
**so that** I can read and check it without writing code.

- One operations layer, shared with the MCP server: id resolution, weak-search marking (a hit is
  `weak` when it matched no name, title, or tag, only prose), issue formatting, and results as
  `{ text, data, ok, error? }`.
- Id resolution takes the id itself, or a name that matches one record by its id after the type or
  by its title, ignoring case, spaces, and hyphens. It also takes `#section`, and short paths
  such as `items.section.value` when only one parameter or event matches. Anything else fails with
  suggestions, so `get buton` suggests `component.button` and exits 1. Typos and prefixes match only
  in `search`.
- Errors carry a code and suggestions, `{ code, suggestions }`: `ERR_UNKNOWN_RECORD`,
  `ERR_UNKNOWN_SECTION`, `ERR_UNKNOWN_IMPLEMENTATION`, `ERR_NO_IMPLEMENTATION`,
  `ERR_INVALID_IMPLEMENTATION`, `ERR_NO_SETUP`, and `ERR_INCOMPLETE_RULES`. An unknown section
  suggests the sections whose path ends in the
  name asked for, so `#title` suggests `#anatomy.title` and `#parts.title`.
- `taproot`: `list [--impl <name>]`, `search`, `get [--impl <name>]`, `setup --impl <name>`,
  `links`, `rules`, `tokens [--part] [--condition] [--property] [--resolve]`, `format [--resolve]`,
  `batch`, `validate`, `help [command]`, and `help agents`. Global flags `--content`, `--config`,
  and `--json`. `list --impl` lists the components that implementation has. Filter values are
  checked against the valid ones.
- `get --impl` appends `renderImplementation`'s output and, when the folder has a setup file, one
  line pointing to `setup`. It fails with `checkImplementation`'s issues as
  `ERR_INVALID_IMPLEMENTATION`.
- `setup --impl <name>` prints that implementation's `README.md`, and fails with `ERR_NO_SETUP` when
  the folder has none.
- When a component follows a record that was left out, `rules` starts with INCOMPLETE, names the
  missing rules, and fails with `ERR_INCOMPLETE_RULES` (exit 1, with the rules it found under
  `results` in JSON).
- `format` prints what an implementer needs from `SPEC.md` and cannot get from a record: the binding
  property names, token keywords, condition syntax, anatomy roles, and the system-wide constants
  with their tokens. `--resolve` adds each constant's value per set. Agents read the spec only
  through the tools, so format decisions they cannot reach get guessed. A test keeps `SPEC.md`'s
  property list equal to the one `format` prints.
- `batch` runs several commands in one call and loads the corpus once, such as
  `taproot batch --command "get button --impl web" --command "tokens button --resolve"`. Each
  `--command` string is split into arguments the way a shell would (quotes group words; no
  variables or globs). It returns one result per command, in order, and with `--json` an array of
  `{ command, exitCode, result, stderr? }`. A failed command does not stop the others; the exit code
  is the highest of the commands' exit codes. A nested `batch`, or `--json`, `--content`, or
  `--config` inside a command, exits 2. Each separate call costs an agent a round trip, so this is
  the cheapest way to answer a task that needs several lookups.
- Output details: each search result names the command that reads it; a search whose hits are all
  weak starts with "No strong match", and weak hits are marked; `get` on a component ends with lines
  naming its implementations and its token count instead of printing the token table; `rules`
  prints each rule's applicability and marks a narrowed rule `(extends <address>)`; a parameter or
  enum value section starts with its path, such as
  `parameters.headingLevel`; parts and items lead with "Options of the `title` part." and "Options
  of each `section`."; `tokens` notes under a non-base condition that the base bindings still apply;
  stray positional words get a hint to quote a value of several words. Hints name every configured
  implementation equally, never one first.
- Exit codes: 0 ok, 1 issues, empty result, or unknown id or section, 2 usage error. Commands other
  than `validate` load with `skipInvalid`, so they leave out broken records and say so on stderr.
- Agent instructions live once in the library: search, get, follow links, cite rules by address (a
  component's include those it inherits, at their own addresses), use `format` for what records do
  not repeat, read the implementation before writing code and `setup` once per project, read
  `guideline.page-setup` before building a page, and use `batch` (CLI) or parallel tool calls (MCP)
  for several lookups. They tell agents to use the CLI when they have a terminal and the MCP server
  when they don't, and to run the CLI from an installed copy (a workspace or project dependency),
  never an `npx` download per call. `taproot help agents` prints them, and a test keeps the copy in
  the repository's `AGENTS.md` equal to that output.
- A benchmark script (`pnpm bench`, not part of `pnpm test`) reports how long `taproot get button`
  takes on the content. The target is under 300 ms on a developer machine.
- Tests of real content run with the repository's config. Tests of implementation output use a
  fixture config, so adding an implementation to the repository changes no output.

**Done when** each command and error code has a test, `batch` returns the same results as the
separate commands and the exit code of its worst one, `taproot get button` finishes in under 1 s in
a test, and `taproot validate` passes on the content.

### 9. Local MCP server

**As** an agent, **I want** the same queries as MCP tools and resources,
**so that** I read the spec the same way a person does.

- `taproot-mcp` (stdio), with `--content` and `--config`: one tool per CLI command except `help` and
  `batch` (MCP clients already call several tools in one turn), each calling the shared operations
  layer. A tool's `structuredContent` is `{ results, error?, warning? }`: `results` is the CLI's
  `--json` output on success, and a failure puts `{ code, suggestions }` in `error`. Tool schemas
  check filter values.
- Each record as a `spec://<id>` resource.
- The server sends the agent instructions from item 8 as its instructions.
- The tools live in a core that uses no Node APIs and reads from what it is given, so item 10 can
  reuse it.
- The server loads content like the CLI, with `skipInvalid`, so a broken file or an unfinished
  draft does not stop it. While files are left out, every answer starts with a `warning` naming
  them and their issues. The server watches the content folder and reloads on a change (ADR 0003).
  A config or file system error during a reload keeps the last index and says so in the warning.

**Done when** for the same query, each tool's `structuredContent.results` equals the CLI's `--json`
output, the server instructions equal `taproot help agents` output, a changed file shows up without
a restart, and content with a broken file still starts the server and warns on every answer.

### 10. Hosted MCP server

**As** an agent with no terminal or installed package, **I want** the same tools at a web address,
**so that** I can read the spec from anywhere (ADR 0006).

- `buildSnapshot` writes one JSON file with the records, implementation mappings and setup files,
  token values, and constants. It runs `checkFromConfig` and stops at any issue, so a deploy cannot
  serve a broken record, token, or mapping. `implementations` names the ones to include, by default
  all.
  `scripts/build-snapshot.js --out <file> [--impl <name>] [--config <path>]` runs it. The file is
  made during a hosted build, and is not committed or published.
- `openSnapshot` opens that file with no Node APIs, and links are rebuilt from the records as they
  are when source files load.
- `handleMcpRequest(snapshot, request)`, exported as `./http`, answers one request with a standard
  web `Request` and `Response`, so any host can call it. It keeps no session between requests and
  answers POST only (405 otherwise).
- The hosted tools are the local ones without `validate`, which checks source files. There is no
  reload: a new deploy is the only way content changes.

**Done when** a parity test finds every read-only call answers the same from the snapshot and from
source files, the snapshot holds no absolute paths from the machine that built it, a test finds no
Node APIs in what the server imports, and a named implementation filter leaves the others out.

## Out of scope

Writing the implementation files themselves (they ship with the components), an agent evaluation,
`apps/mcp` and its per-host entry files, Changesets and npm publishing, the component authoring
scripts and skills, the components, the tokens package, the docs site, and Storybook.
