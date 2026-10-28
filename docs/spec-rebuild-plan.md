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
  states, preferences, rules, accessibility, tokens, rationale), `status`, `known-issues`, links,
  sections, cross-record checks, versioning.
- Include a Conventions section: plain rule ids with shared ones (`visible-focus`,
  `forced-colors`, `not-a-control`, `not-color-alone`); `label` vs `accessibleName`; decorative
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
  rule ids, top-level fields, and dotted paths into anatomy, parameters, events, and enum values;
  annotation ids in examples.
- Cross-record checks from `SPEC.md`: unique ids; resolvable link targets, `instead` ids,
  references, and sections; rule ids unique and not equal to a top-level field name; enum
  `default`/`examples`/`guidance` keys within `values`; token parts and conditions declared;
  annotation ids unique and not equal to a heading slug; asset files exist and stay inside the
  record's folder; `known-issues` URLs are valid; no text starting with `TODO`.
- `validateSpec()` returns `{ issues, recordCount }`. `loadSpec()` throws a `SpecError` with
  `issues`, or with `skipInvalid: true` leaves out invalid files and lists them in `spec.issues`.
  A link to a record left out this way is itself an issue.
- Port the old package's `test/fixtures/*` one for one (except `token-tier`): one fixture per
  check.

**Done when** each check has a failing fixture whose issue names the file, line, JSON pointer, and
message, and `skipInvalid` still serves the valid records.

### 3. Seed content

**As** a contributor, **I want** real content that exercises every part of the format,
**so that** the format is proven on real records before the query layer is built on it.

- Button with every field; minimal drafts of Link, Badge, and Icon, so Button's `instead` and
  `composes` targets exist; Text field, which follows `pattern.form-field`;
  `pattern.action-hierarchy`, `pattern.form-field`, `guideline.compose-or-propose`; and one example
  with an image asset and annotations.
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
  `follows` or `related`; enum `guidance` → `follows` from the value's section.
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
  first, with each rule's applicability.
- `tokens(id, { part, condition, property })`, with values when a `resolveToken` function was
  passed to `loadSpec`.
- `render(target)`: Markdown for a record or a section, with draft/deprecated notes and known issues
  under the summary. Throws on an unknown record or section.
- Package exports: `.` (the library), `./config`, `./tokens-dtcg`, `./implementation`, and the
  schema.

**Done when** each operation and filter is tested against the seed and fixtures, a search for
`input` (a tag on Text field, not in its title) returns `component.text-field` first, and returned
records are frozen.

### 6. Config and token resolution

**As** an adopter, **I want** to point the package at my content and token sets in one config file,
**so that** it works in any repository.

- `spec.config.json`, found by walking up from the working directory: `content`, `implementations`
  (technology → folder, such as `web` → `packages/components/implementation`), and `tokens`
  (`format: dtcg`, named sets such as `light` and `dark`, later files win). Paths are relative to
  the config file.
- The content folder comes from `--content`, then the config. With neither, fail with a message
  that says how to set one.
- A DTCG resolver that follows `{alias}` references, detects alias cycles, stringifies values
  (`{ value: 16, unit: "px" }` becomes `16px`), and returns a value per set. Token files are read
  only when values are requested, or by `validate`.
- `validate` checks every token reference: a keyword (`transparent`, `none`, `inherit`, `linear`)
  or a token present in every configured set.

**Done when** a fixture resolves a reference to light and dark values, an unknown reference fails
`validate`, and an alias cycle reports an issue instead of hanging.

### 7. Implementation files

**As** an engineer or agent, **I want** a per-technology file that maps a component's parameters and
events to its real API, **so that** I use the right attribute names instead of guessing them from
parameter names.

- The files live with the implementation, such as `packages/components/implementation/<name>.md`,
  not in the spec content. The spec package only reads the folders the config names, and never
  requires a file to exist. Whether a finished component must have one is for the implementation's
  own tests.
- Format: Markdown with front matter: `component` (record id), `package`, `tagName`,
  `defineExport`, `usage`, and `api` rows (`name`, `kind` of attribute, property, or event, the
  `parameter` or `event` it implements, and `values` when value names differ), plus a body of
  technology-only guidance.
- Check each file that exists against its record: the component exists; every mapped parameter,
  value, and event exists; and every parameter and event of the record has a row. `validate` runs
  these checks for each configured folder, and `get` with that implementation fails with the same
  issues.
- `get` with an implementation appends the rendered file: package, usage, and an API table whose
  descriptions come from the record.

**Done when** a mapping to a missing parameter, or a record parameter with no row, fails `validate`,
a component with no file passes, and `get` with `web` renders the API table from a fixture folder
outside the spec content.

### 8. CLI

**As** a person or agent, **I want** to query the spec from a terminal,
**so that** I can read and check it without writing code.

- One operations layer, shared with the MCP server: id resolution (plain names, `#section`, unique
  prefix, single-word typos), filter values checked against the valid ones, issue formatting, and
  results as `{ text, data, ok, error? }`.
- Errors carry a code and suggestions, `{ code, suggestions }`: `ERR_UNKNOWN_RECORD`,
  `ERR_UNKNOWN_SECTION`, `ERR_UNKNOWN_IMPLEMENTATION`, `ERR_NO_IMPLEMENTATION`, and
  `ERR_INVALID_IMPLEMENTATION`.
- `ds-spec`: `list`, `search`, `get [--impl <name>]`, `links`, `rules`,
  `tokens [--part] [--condition] [--property] [--resolve]`, `batch`, `validate`, `help [command]`.
  Global flags `--content`, `--config`, and `--json`.
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
  rule's applicability.
- Exit codes: 0 ok, 1 issues, empty result, or unknown id or section, 2 usage error. Commands other
  than `validate` skip broken records and say so on stderr.

- A benchmark script (`pnpm bench`, not part of `pnpm test`) reports how long `ds-spec get button`
  takes on the seed. The target is under 300 ms on a developer machine.

**Done when** each command and error code has a test, `batch` returns the same results as the
separate commands and the exit code of its worst one, `ds-spec get button` finishes in under 1 s in
a test, and `ds-spec validate` passes on the seed.

### 9. MCP server

**As** an agent, **I want** the same queries as MCP tools and resources,
**so that** I read the spec the same way a person does.

- `ds-spec-mcp` (stdio): one tool per CLI command except `batch` (MCP clients already call
  several tools in one turn), each calling the shared operations layer. A tool's `structuredContent` is the CLI's `--json` output, and a failure puts
  `{ code, suggestions }` in `structuredContent.error`.
- Each record as a `spec://<id>` resource.
- Agent instructions live once in the library: search, get, follow links, cite rules by address,
  read the implementation before writing code, and use `batch` (CLI) or parallel tool calls (MCP)
  for several lookups. They tell agents to use the CLI when they have a terminal and the MCP server
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
