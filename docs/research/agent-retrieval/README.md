# Agent retrieval evaluation

- Started: 2026-10-01.
- Question: can an agent build correct markup with the design system using only the knowledge CLI?
- Prompted by: a comparison with Astryx (`@astryxdesign/cli`), whose CLI serves component docs, imports, and a typed JSON API from one command.

## Method

Each task runs in a fresh agent (Sonnet) with no prior context. The agent may run any
`pnpm knowledge …` command from the repository root and may not read, list, or search repository
files. It writes a static HTML snippet and reports every command it ran and, for each element,
attribute, and import, whether the CLI told it or it guessed.

Each run is scored on three numbers:

- **Retrieval steps**: `pnpm knowledge` commands run.
- **Invented APIs**: tag names, attributes, packages, or registration that do not match
  `packages/components/implementation/<slug>.md`. Each distinct wrong name counts once.
- **Rule mistakes**: MUST or SHOULD rules the output breaks when it runs, including rules the agent
  meant to follow but broke through an invented API.

The agent is told the system ships as web components, because a real consumer knows their stack.

## Tasks

The prompt for each task, after the shared rules above:

- **A. Profile settings form.** A "Display name" text field, an "Email" text field with a hint, a
  "Send me product updates" checkbox, and two actions: Save changes (submits the form) and Cancel.
- **B. Delete account.** A "Delete account" danger-zone section: a short explanation, a button that
  deletes the account (this is irreversible), and a way to go back to the account overview page at
  `/account`.
- **C. Document row header.** The document title, a "Draft" status indicator, and two icon-only
  actions: Edit and Delete. Inline SVG icons are available.

## Results

| Run | Task | Steps | Invented APIs | Rule mistakes |
| --- | --- | --- | --- | --- |
| Baseline | A | 8 | 5 | 1 |
| Baseline | B | 8 | 4 | 0 |
| Baseline | C | 10 | 5 | 1 |
| `--impl` | A | 12 | 0 | 0 |
| `--impl` | B | 11 | 0 | 0 |
| `--impl` | C | 8 | 0 | 0 |
| Final | A | 9 | 0 | 0 |
| Final | B | 8 | 0 | 0 |
| Final | C | 9 | 0 | 0 |

### Baseline (2026-10-01, before implementation lookup)

Outputs are in [`baseline/`](baseline/).

Component choice and design intent were right in every run. Agents picked the right components,
used `danger` only for the destructive action, kept one primary action, chose Link over Button
for navigation, and cited rules by address. No intent-level rule was missed.

Every run guessed the implementation, because no command returns it:

- **Tag names**: `ember-*` (A, B) and `es-*` (C). The real prefix is `ds-`. None of the markup
  would render.
- **Package and registration**: `@ember-sage/components` in three forms. The real package is
  `@stevegreco/design-system-components`, with a `define<Name>` export per component.
- **`action` attribute** (A, B): the record parameter is `action`, but the web attribute is `type`,
  with `activate` mapped to `button`. In A, Save changes would not submit the form, which breaks
  `component.button#explicit-form-action` (SHOULD) in practice.
- **`accessible-name` attribute** (C): the record parameter is `accessibleName`, but the web
  attribute is `aria-label`. Both icon-only buttons would have no accessible name, which breaks
  `component.button#a11y-icon-accessible-name` (MUST) in practice.

The two rule mistakes both come from the parameter-to-attribute mapping, not from misreading a
rule. The knowledge is enough to decide what to build. It is not enough to write it.

### With `get --impl web` (2026-10-01)

Outputs are in [`impl/`](impl/). Same tasks, prompts, and model, after
`knowledge get <id> --impl web` started serving the implementation files.

Every agent found `--impl` from `knowledge help` and used it on each component. Every element,
attribute, and import matched the implementation files, including `type="submit"` and
`aria-label`, so both rule mistakes are gone. Agents also applied the web guidance, such as the
explicit `type="button"` on Cancel and no product CSS on Button.

Steps did not fall:

- **A** ran three extra commands to re-read the implementation sections, because the output was
  truncated. A text field record plus its implementation is about 10 KB, and the token table is a
  large part of it.
- **B** asked for an implementation of an example record, which has none.

Still guessed in every run:

- **Loading the modules in a page.** Agents wrapped the bare-specifier imports in
  `<script type="module">`, which needs a bundler or an import map.
- **The token stylesheet.** Button's guidance says to load it at the application root, but nothing
  names the package or file.

### Final (2026-10-01, with names, typo search, next steps, and short records)

Outputs are in [`final/`](final/). Same tasks, prompts, and model, after forgiving lookups,
next-step lines in search results, and a default `get` without the token table.

Totals across the three tasks:

| Run | Steps | Invented APIs | Rule mistakes |
| --- | --- | --- | --- |
| Baseline | 26 | 14 | 2 |
| `--impl` | 31 | 0 | 0 |
| Final | 26 | 0 | 0 |

Steps came back to the baseline while every run now also reads the implementation. No run
re-read truncated output or asked for an implementation of a non-component. A also ran six
commands that failed because it quoted the whole subcommand as one shell word; they are not
counted, since no CLI change affects them.

Judgment calls, not counted as mistakes:

- C labeled the icon-only buttons "Edit" and "Delete". `component.button#label-describes-result`
  gives "Delete account" as its example, so "Delete document" would follow it more closely.
- C used the `default` Badge variant for Draft, and the earlier C run used `warning`. The Badge
  record gives no guidance for a draft state.

Still guessed in every run that needed it: loading bare-specifier imports in a static page, and the
token stylesheet. Both need a getting-started record or implementation note, not a CLI change.

