# Spec review: structure and maintainability

Repo: stevegreco/design-system at `eacd841` (main). Read-only review. Lens: file layout, templates,
schema, duplication, and how easy the spec is to keep current. Goal is a simple first iteration.

## What already works

- One file per record, identity by `id` not path, no build step. Easy to reason about.
- A single JSON Schema plus cross-record checks, and tests that fail on any issue with file and line.
- A scaffold (`pnpm component:new --phase spec`) whose `TODO:` placeholders are caught by validation.
- Typed links written once with derived inverses, so most cross-references can't drift.

## Findings (most severe first)

### 1. Shared form-field rules are copied into four records, and the copies already drift — High
- **Evidence:** `text-field`, `text-area`, `select`, and `checkbox` each carry the same 11 rules
  (`visible-label`, `hint-adds-guidance`, `error-says-what-to-fix`, `error-marks-invalid`,
  `error-blocks-submit`, `form-value`, `a11y-visible-label`, `a11y-described-by`,
  `a11y-invalid-message`, `a11y-required`, `a11y-visible-focus`). They have already diverged:
  `text-field.spec.yaml` lines 103 and 143 say "Placeholder text is not a label"; the
  `text-area` copies dropped that sentence.
- **Why it matters:** every change to field guidance has to be made four times, and nothing
  catches a missed copy.
- **Fix:** add one `pattern.form-field` (or guideline) with those rules as sections. Each field
  component keeps only its own rules and adds `links.follows: [pattern.form-field]` plus a rule
  `references` entry where a citation is needed. No schema change required.

### 2. Two YAML styles in component records — Medium
- **Evidence:** `switch.spec.yaml` (from line 52) and `radio-group.spec.yaml` write rules and
  parameters as flow maps (`- { id: …, level: …, }`); the other 11 records use block style.
- **Why it matters:** diffs and review are harder, copy-paste between records breaks, and it
  signals the template isn't being followed.
- **Fix:** convert both to block style and add a format check (oxfmt or a yaml lint rule) that
  rejects flow maps in `*.spec.yaml`.

### 3. Rule ID prefixes are inconsistent — Medium
- **Evidence:** `a11y-visible-focus` in button, checkbox, link, select, text-area, text-field;
  `visible-focus` and `forced-colors` in alert and dialog; `forced-colors-visible` in switch.
  `topic: accessibility` already carries the category.
- **Why it matters:** rule addresses are meant to be stable and citable; the same requirement
  has three spellings, and cross-component queries by id don't line up.
- **Fix:** pick one convention (drop the `a11y-` prefix since `topic` covers it), rename once
  while the format is young, and add the convention to SPEC.md § Rules.

### 4. The format is described in four places, and they disagree — Medium
- **Evidence:** `packages/spec/SPEC.md` (normative), `docs/adr/0002-record-format.md` (restates
  every field list), `docs/rfcs/0002-knowledge-layer-architecture.md` (446 lines, restates record
  types/fields), and `packages/spec/README.md`. ADR 0002 links to `packages/knowledge/SPEC.md`,
  which no longer exists, and its field list omits `known-issues` and enum `guidance`.
- **Why it matters:** a contributor can't tell which is current; every format change has to
  touch several documents.
- **Fix:** keep SPEC.md as the only field reference. Cut ADR 0002 to decisions and reasons only
  (it says it "does not repeat the fields" but does), fix the link, and mark RFC 0002 as
  historical in its header.

### 5. AGENTS.md contradicts the tooling about implementation checks — Medium
- **Evidence:** `AGENTS.md` line 38: "Nothing checks an implementation against a spec." But
  `packages/spec/README.md` lines 112–113 describe `checkImplementation`, which verifies every
  parameter, value, and event is mapped, and `get --impl` reports `ERR_INVALID_IMPLEMENTATION`.
- **Why it matters:** agents follow AGENTS.md first; wrong guidance here leads to skipped checks.
- **Fix:** say what is checked (API mapping coverage) and what isn't (behavior and styling).

### 6. Implementation files restate spec guidance — Medium
- **Evidence:** `apps/documentation/implementation/button.md` § "Map intent to variants"
  restates the variant meanings from `button.spec.yaml` and `pattern.action-hierarchy`;
  §§ "Handle labels and icons" and "Handle unavailable actions" restate rules
  `a11y-icon-accessible-name` and `explain-disabled`. Commit `5cbe6d9` already fixed this for
  Alert by citing rule ids, so the right pattern exists but isn't applied everywhere.
- **Why it matters:** two sources of truth for the same guidance; the spec is supposed to win.
- **Fix:** apply the Alert approach to all 13 implementation files: keep only web-specific
  content (attributes, slots, forms, framework notes) and cite rule addresses for the rest.
  Add one line to the implement-component skill saying so.

### 7. `summary` and `description` mostly say the same thing — Low
- **Evidence:** Button: summary "Use Button to trigger an action or to submit or reset a form",
  description "Triggers an action or submits or resets a form." Same for Link, Badge, Text field,
  Text area, Select.
- **Why it matters:** two required fields to keep in sync for one idea; authors of new drafts
  must write both.
- **Fix:** either make `description` optional (use it only when it adds anatomy or behavior, as
  Dialog and Tabs do), or document the distinction in SPEC.md with a short do/avoid.

### 8. A folder per component holding one file — Low
- **Evidence:** `content/components/<name>/<name>.spec.yaml` for all 13; every folder has exactly
  one file. The `# yaml-language-server: $schema=../../../src/schema/…` header depends on that
  depth, while SPEC.md says "the folder layout is up to the adopter."
- **Why it matters:** small, but it adds a level to navigate and ties the schema hint to depth.
- **Fix:** either flatten to `content/components/<name>.spec.yaml`, or keep folders and state
  what else will live there (assets, examples). Map the schema by glob in `.vscode/settings.json`
  instead of a per-file relative path.

### 9. Repo process lives inside the portable format doc — Low
- **Evidence:** SPEC.md § Status: "The docs tests fail if a draft has an implementation file…"
  and § Cross-record checks mentions scaffolded `TODO:` drafts. SPEC.md otherwise claims to be
  technology- and repo-neutral.
- **Fix:** keep the meaning of `draft` in SPEC.md and move the test and scaffold behavior to the
  README or the spec-component skill.

### 10. Historical documents mixed with current ones — Low
- **Evidence:** `docs/rfcs/0001-…` (superseded, references removed ADRs and KNOW-00x ids),
  `docs/research/component-contracts/*.md` link into `packages/knowledge/…` paths that no longer
  exist; "knowledge layer" naming persists in ADR/RFC file names, AGENTS.md, and the spec README.
- **Fix:** move superseded RFCs and research into `docs/archive/` (or delete; git keeps history),
  and add a link check over `docs/` to CI.

### 11. Token config repeats shared files per theme — Low
- **Evidence:** `spec.config.json` lists `primitives`, `shape`, and `typography` token files in
  both `light` and `dark`.
- **Fix:** optional `shared` list merged into each set. Only worth it if more themes are coming.

## Suggested order

1 (shared field pattern) and 5 (AGENTS.md accuracy) give the most value for little work. 2 and 3
are cheap mechanical cleanups best done now, before more records exist. 4, 6, and 10 are doc
consolidation that can be one pass. 7–9 and 11 are optional simplifications.
