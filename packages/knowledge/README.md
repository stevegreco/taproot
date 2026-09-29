# Design system knowledge

`@stevegreco/design-system-knowledge` holds the design system's knowledge as plain files, and a small
library that reads, validates, and queries them.

- The format is defined in [SPEC.md](SPEC.md) and the JSON Schema in
  [`src/schema/knowledge-record.schema.json`](src/schema/knowledge-record.schema.json).
- The reasoning is in [RFC 0002](../../docs/rfcs/0002-knowledge-layer-architecture.md).

There is no build step. The library reads the authored files directly and keeps an index in memory.
A command-line tool and a local MCP server call the same library. See [CLI](#cli) and
[MCP server](#mcp-server).

## Where to edit content

Edit the files in [`content/`](content). Components are `*.spec.yaml`. Patterns, guidelines, and
examples are Markdown files with front matter that has an `id`. Folders are up to you. See
[SPEC.md](SPEC.md) for every field.

Validate after a change:

```sh
pnpm --filter @stevegreco/design-system-knowledge test
```

The tests load all content and fail on any issue. Each issue names the file, the line when known,
the JSON pointer of the field, and the problem.

## Library

```js
import { loadKnowledge, validateKnowledge } from "@stevegreco/design-system-knowledge";

// Throws a KnowledgeError, with `error.issues`, when any content is invalid.
const knowledge = await loadKnowledge();

// Or collect the issues instead of throwing.
const { issues, recordCount } = await validateKnowledge({ contentDir: "./my-content" });
```

Options: `contentDir` (default: the content shipped in this package) and `resolveToken`, which maps a
token reference to values, such as `{ light: "#fff", dark: "#000" }`.

```js
knowledge.list({ type: "component", tag: "action", status: "stable" }); // summaries, sorted by id
knowledge.get("component.button"); // the whole record, frozen

knowledge.section("pattern.action-hierarchy#assign-emphasis"); // heading, rule, field, or annotation
knowledge.section("component.button#label-describes-result");

knowledge.search("destructive action", { type: "pattern", tags: ["action"], limit: 5 });
// [{ id, type, title, summary, tags, status, score, matches }]

knowledge.links("component.link", { kind: "alternative-to", direction: "out" });
// Inverses are included: button lists link as an alternative, so link lists button as alternative-to.

knowledge.rules({ topic: "accessibility", level: "must", query: "focus" });
// [{ address: "component.button#a11y-visible-focus", ... }], must first

knowledge.tokens("component.button", { condition: "variant.primary + hover" });
// [{ part, condition, property, token, values? }]

knowledge.render("component.button"); // Markdown for a record
knowledge.render("pattern.action-hierarchy#choose-button-or-link"); // or one section
```

`validateKnowledge`, `renderRecord(knowledge, target)`, `KnowledgeError`, `schema`, and
`DEFAULT_CONTENT_DIR` are also exported. `render` throws when the record or section does not exist.

Links come from three places: the `links` field, `usage.avoid[].instead` (an `alternative` link), and
rule `references` (`follows` for a pattern or guideline, `related` otherwise). `links` returns links
from the record (`direction: "out"`), links to it (`"in"`), or `"both"`. The default, `"out"`, is
complete on its own because every link is stored with its inverse.

## Config

Both tools find their content with a `knowledge.config.json`, found by walking up from the working
directory. Paths are relative to the config file. `tokens` is optional.

```json
{
  "content": "packages/knowledge/content",
  "tokens": {
    "format": "dtcg",
    "sets": { "light": ["tokens/base.json", "tokens/light.json"], "dark": ["tokens/base.json", "tokens/dark.json"] }
  }
}
```

The content folder comes from `--content`, then the config, then the folder shipped in this package.
Each token set lists DTCG files. Later files win, `{alias.path}` references resolve, and values are
stringified (`{ value: 16, unit: "px" }` becomes `16px`). Token files are read only when values are
requested. Use `createDtcgResolver` from `@stevegreco/design-system-knowledge/tokens-dtcg` and
`loadFromConfig` from `.../config` to do the same in code.

## CLI

```sh
knowledge validate
knowledge list [--type <t>] [--tag <tag>] [--status <s>]
knowledge search <query...> [--type <t>] [--tag <tag>] [--limit <n>]
knowledge get <id | id#section>
knowledge links <id> [--kind <k>] [--direction out|in|both]
knowledge rules [--id <id or address>] [--topic <t>] [--level <l>] [--query <text>]
knowledge tokens <id> [--part <p>] [--condition <c>] [--property <p>] [--resolve]
knowledge help [command]
```

Global flags: `--content <dir>`, `--config <path>`, `--json`. Output is Markdown, or the library's
return values as JSON. Exit codes: 0 ok, 1 validation issues or an unknown id or section, 2 usage
error. In this repo, run it as `pnpm knowledge ...`.

## MCP server

`knowledge-mcp` is a local stdio server (`--content` and `--config` work as in the CLI). Tools:
`search`, `get`, `list`, `links`, `rules`, `tokens`, and `validate`. Every record is also a resource
at `knowledge://<id>`. The server reloads when the content folder changes, and if the new content has
issues it keeps serving the last valid version and starts each tool result with a warning.

```json
{ "mcpServers": { "design-system-knowledge": { "command": "node", "args": ["packages/knowledge/bin/knowledge-mcp.js"] } } }
```
