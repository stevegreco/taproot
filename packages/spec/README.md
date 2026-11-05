# Design system spec

`@taproot-ds/spec` holds the design system spec as plain files: technology-neutral
records for components, patterns, guidelines, and examples, with rules that have an address and a
level. A small library reads, validates, and queries them.

## Start here

| To                                  | Read                                                          |
| ----------------------------------- | ------------------------------------------------------------- |
| Look up a field or write a record   | [SPEC.md](SPEC.md), the only field reference                  |
| Query the spec                      | [CLI](#cli), or `node packages/spec/bin/taproot.js help` from the repository root |
| Understand the format's decisions   | The ADRs in [`docs/adr/`](../../docs/adr)                     |

The JSON Schema is [`src/schema/spec-record.schema.json`](src/schema/spec-record.schema.json).

There is no build step. The library reads the authored files directly and keeps an index in memory.
A command-line tool and a local MCP server call the same library. See [CLI](#cli) and
[MCP server](#mcp-server).

## Where to edit content

Edit the files in [`content/`](content). Components are `*.spec.yaml`. Patterns, guidelines, and
examples are Markdown files with front matter that has an `id`. Folders are up to you. See
[SPEC.md](SPEC.md) for every field.

Validate after a change:

```sh
pnpm --filter @taproot-ds/spec test
```

The tests load all content and fail on any issue. Each issue names the file, the line when known,
the JSON pointer of the field, and the problem.

## Library

```js
import { loadSpec, validateSpec } from "@taproot-ds/spec";

// Throws a SpecError, with `error.issues`, when any content is invalid.
const spec = await loadSpec();

// Or collect the issues instead of throwing.
const { issues, recordCount } = await validateSpec({ contentDir: "./my-content" });
```

Options: `contentDir` (default: the content shipped in this package) and `resolveToken`, which maps a
token reference to values, such as `{ light: "#fff", dark: "#000" }`.

```js
spec.list({ type: "component", tag: "action", status: "stable" }); // summaries, sorted by id
spec.get("component.button"); // the whole record, frozen

spec.section("pattern.action-hierarchy#assign-emphasis"); // heading, rule, field, or annotation
spec.section("component.button#label-describes-result");
spec.section("component.button#parameters.variant.destructive");
// An enum value's content is { meaning, example?, guidance? }: its meaning, with the example and
// guidance section the parameter pairs with it.

spec.search("destructive action", { type: "pattern", tags: ["action"], limit: 5 });
// [{ id, type, title, summary, tags, status, score, matches }], best first. Hits scoring below a
// quarter of the top hit are dropped, so weak one-word matches do not crowd the results.

spec.links("component.link", { kind: "alternative-to", direction: "out" });
// Inverses are included: button lists link as an alternative, so link lists button as alternative-to.

spec.rules({ topic: "accessibility", level: "must", query: "focus" });
// [{ address: "component.button#visible-focus", ... }], must first

spec.rules({ id: "component.text-field" });
// Its own rules and the ones it inherits, such as { address: "pattern.form-field#error-blocks-submit",
// recordId: "pattern.form-field", appliesTo: "component.text-field", ... }

spec.tokens("component.button", { condition: "variant.primary + hover" });
// [{ part, condition, property, token, values? }]

spec.render("component.button"); // Markdown for a record
spec.render("pattern.action-hierarchy#choose-button-or-link"); // or one section
```

`validateSpec`, `renderRecord(spec, target)`, `SpecError`, `schema`, and
`DEFAULT_CONTENT_DIR` are also exported. `render` throws when the record or section does not exist.

Links come from four places: the `links` field, `usage.avoid[].instead` (an `alternative` link),
rule `references` (`follows` for a pattern or guideline, `related` otherwise), and an enum
parameter's `guidance` (a `follows` link whose `fromSection` names the value, such as
`parameters.variant.destructive`). `links` returns links
from the record (`direction: "out"`), links to it (`"in"`), or `"both"`. The default, `"out"`, is
complete on its own because every link is stored with its inverse, so `"both"` lists each
relationship once. A link's kind reads from its `from` side: an incoming `alternative` link from
Button means Badge is the alternative to Button.

## Config

Both tools find their content with a `spec.config.json`, found by walking up from the working
directory. Paths are relative to the config file. `implementations`, `constants`, and `tokens` are
optional.

```json
{
  "content": "packages/spec/content",
  "implementations": {
    "web": { "folder": "packages/components/implementation", "technology": "web-component" },
    "react": { "folder": "packages/react/implementation", "technology": "react" }
  },
  "constants": {
    "border-width": "semantic.border.width",
    "focus-ring-width": "semantic.focus.width",
    "focus-ring-offset": "semantic.focus.offset"
  },
  "tokens": {
    "format": "dtcg",
    "sets": { "light": ["tokens/base.json", "tokens/light.json"], "dark": ["tokens/base.json", "tokens/dark.json"] }
  }
}
```

The content folder comes from `--content`, then the config, then the folder shipped in this package.
Each token set lists DTCG files. Later files win, `{alias.path}` references resolve, and values are
stringified (`{ value: 16, unit: "px" }` becomes `16px`). Token files are read only when values are
requested, or by `validate`. Use `createDtcgResolver` and `readDtcgTokenNames` from
`@taproot-ds/spec/tokens-dtcg`, and `loadFromConfig` and `validateFromConfig` from
`.../config`, to do the same in code. `loadSpec({ skipInvalid: true })` leaves out invalid record
files and lists their issues in `spec.issues` instead of throwing.

`constants` names the system-wide constants, such as border width, that every component uses and
component records do not have to bind, each with the token that holds it. `format` serves them, and
`validate` checks that each token is in every token set.

Each implementation folder holds one `<slug>.md` file per component that a technology implements:
front matter with the record id, package, what to import, usage, and API rows that name the record
parameter or event each member implements, then Markdown guidance. The folder's `technology` sets
the rest. A folder that does not exist yet reads as nothing implemented. A `web-component` file names its `tagName` and `defineExport`, and its rows are
`attribute`, `property`, or `event`. A `react` file names its `export`, and its rows are `prop` or
`callback`. A `parts` or `items` entry has its own rows for each record part and item. An item names
its own `tagName` or `export`, or in React the array `prop` whose entries are the items, with a
`field` row per key. A part names one only when it is its own element or component. Records stay technology-neutral; these files live with the implementation. Other
tools can read the same files with `loadImplementations`, `parseImplementation`, and
`checkImplementation` from `@taproot-ds/spec/implementation`.
`checkImplementation` confirms the file is named after a component record and that every
parameter, value, and event a row names exists and every one the record has is covered; `get
--impl` reports a mismatch as `ERR_INVALID_IMPLEMENTATION` instead of printing incomplete rows.

## CLI

```sh
taproot validate
taproot list [--type <t>] [--tag <tag>] [--status <s>] [--impl <name>]
taproot search <query...> [--type <t>] [--tag <tag>] [--limit <n>]
taproot get <id | name | id#section> [--impl <name>]
taproot links <id> [--kind <k>] [--direction out|in|both]
taproot rules [--id <id or address>] [--topic <t>] [--level <l>] [--query <text>]
taproot tokens <id> [--part <p>] [--condition <c>] [--property <p>] [--resolve]
taproot format [--resolve]
taproot batch --command "<command>" [--command "<command>" ...]
taproot help [command]
```

Global flags: `--content <dir>`, `--config <path>`, `--json`. Output is Markdown, or the library's
return values as JSON. Exit codes: 0 ok, 1 validation issues, an empty result, or an unknown id or
section, 2 usage error, including a filter value (`--type`, `--status`, `--kind`, `--topic`,
`--level`) that is not one of the valid ones, which the error lists. In this repo, run it as
`node packages/spec/bin/taproot.js ...`. `pnpm spec ...` also works, but pnpm adds about a second
to each call. Elsewhere, run the installed bin (`node_modules/.bin/taproot`), not an `npx` download
per call. `pnpm bench` times `taproot get button` against a 300 ms target, and a test in
`pnpm test` fails if it takes over a second.

`taproot help agents` prints how an agent should use the spec. The MCP server sends the same text
as its instructions, and AGENTS.md carries a copy that a test keeps equal.

`validate` also checks each token reference against the token sets in the config. The other
commands leave out any record file with issues, say so on stderr, and serve the rest, so one broken
draft does not hide its neighbors.

When the best `search` hit is weak (it matched no name, title, or tag), the output starts with "No
strong match", each weak hit is marked, and `--json` hits carry `weak: true`.

`rules` prints each rule's level, address, and statement, and the condition it applies under, if
any, so a conditional rule never reads as unconditional. A closing line says how to read a rule's
rationale, references, and examples with `get <address>`. `rules --id <component>` includes the
rules the component inherits from the patterns and guidelines it follows, each at the address where
it is written, and marks a rule that narrows one of them with `(extends <address>)`.

A whole component record leaves out its token table, which is most of its length; a closing line
gives the count and the command. Read the table with `get <id>#tokens` or filter it with `tokens`.
JSON output and `spec://` resources keep the full record.

`get <id> --impl web` prints the record followed by its web implementation: package, element,
import, usage, an API table mapping each attribute to the parameter it implements, and the guidance.
With `--json` it returns `{ record, implementation }`. A plain `get` of an implemented component ends
with a line naming every configured implementation that has a file for it, and each `search` result
does the same, so no technology reads as the default.

`batch` runs several commands in one process and loads the spec once, which takes about half the
time of separate calls. Each `--command` is split into words the way a shell would (quotes group
words, with no variables or globs), and takes the batch's `--json`, `--content`, and `--config`
instead of its own. Text output gives each command's output under a `$ taproot <command>` line;
`--json` prints an array of `{ command, exitCode, result }`, where `result` is that command's own
JSON. A failed command does not stop the others, and the batch exits with the highest exit code.
The MCP server has no `batch` tool, since MCP clients already call several tools in one turn.

`format` prints the parts of [SPEC.md](SPEC.md) an implementer needs and records do not repeat: the
property names token bindings use, the token keywords, condition syntax, anatomy roles, and the
system-wide constants with their tokens. `--resolve` adds each constant's value in each token set.

`get`, `links`, `tokens`, and `rules --id` take a record id or a name that matches one record, such
as `button` or `text field`. A one-word `search` tolerates typos, the start of a
name or title matches (`chec`, `textfi`), and each result is followed by the command that reads it. An unknown id or section suggests the closest ones. With `--json`, a failed lookup prints
`{ error, code, suggestions }`, where `code` is one of `ERR_UNKNOWN_RECORD`, `ERR_UNKNOWN_SECTION`,
`ERR_UNKNOWN_IMPLEMENTATION`, `ERR_NO_IMPLEMENTATION`, or `ERR_INVALID_IMPLEMENTATION`. Branch on `code`, not on the message.

## MCP server

`taproot-mcp` is a local stdio server (`--content` and `--config` work as in the CLI). Tools:
`search`, `get`, `list`, `links`, `rules`, `tokens`, `format`, and `validate`. `get` takes an optional
`implementation`, such as `"web"`, that works like `--impl`. Names, typo suggestions, and next-step
lines work as in the CLI, and a failed call's `structuredContent.error` holds `{ code, suggestions }`. Every record is also a resource
at `spec://<id>`. The server reloads when the content folder changes, and if the new content has
issues it keeps serving the last valid version and starts each tool result and resource read with a
warning.

```json
{ "mcpServers": { "taproot": { "command": "node", "args": ["packages/spec/bin/taproot-mcp.js"] } } }
```

## Use in another project

The package ships the records, so `taproot` and `taproot-mcp` work after an install. Implementation
names (`get --impl`), token values (`--resolve`), and the system-wide constants come from the other
packages, so add a `spec.config.json` at the project root that points at the ones you install. Leave
out `content` to use the shipped records, and leave out the implementation you do not use.

```bash
pnpm add -D @taproot-ds/spec @taproot-ds/tokens @taproot-ds/web-components
```

```json
{
  "implementations": {
    "web": {
      "folder": "node_modules/@taproot-ds/web-components/implementation",
      "technology": "web-component"
    }
  },
  "constants": {
    "border-width": "semantic.border.width",
    "focus-ring-width": "semantic.focus.width",
    "focus-ring-offset": "semantic.focus.offset"
  },
  "tokens": {
    "format": "dtcg",
    "sets": {
      "light": [
        "node_modules/@taproot-ds/tokens/src/tokens/primitives.tokens.json",
        "node_modules/@taproot-ds/tokens/src/tokens/semantic/light.tokens.json",
        "node_modules/@taproot-ds/tokens/src/tokens/semantic/shape.tokens.json",
        "node_modules/@taproot-ds/tokens/src/tokens/semantic/typography.tokens.json"
      ],
      "dark": [
        "node_modules/@taproot-ds/tokens/src/tokens/primitives.tokens.json",
        "node_modules/@taproot-ds/tokens/src/tokens/semantic/dark.tokens.json",
        "node_modules/@taproot-ds/tokens/src/tokens/semantic/shape.tokens.json",
        "node_modules/@taproot-ds/tokens/src/tokens/semantic/typography.tokens.json"
      ]
    }
  }
}
```

```json
{ "mcpServers": { "taproot": { "command": "node_modules/.bin/taproot-mcp" } } }
```
