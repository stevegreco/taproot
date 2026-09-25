# ADR 0006: Alignment with Open Knowledge Format principles

**Status:** Accepted

Originally numbered 0004. Renumbered to 0006 because it shared that number with
[ADR 0004](./0004-compact-visual-authoring.md).

This decision does not change the knowledge schema, compiler, content, or
`openCatalog`. It records which [Open Knowledge Format (OKF)
v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format) principles
Ember & Sage already shares, and which OKF conventions we will not adopt as the
authoring format.

OKF is Google Cloud's markdown-plus-YAML knowledge bundle specification.

## Context

Several OKF ideas already match this catalog: authored records are git-diffable
Markdown with YAML frontmatter; delivery tools are not the source of truth;
agents should retrieve a focused record and follow neighbors; provenance and
lifecycle are structured fields.

OKF also makes choices we rejected for this corpus. It treats path as identity,
allows unregistered `type` values, and treats untyped Markdown links as the
graph. It does not require a compile step. It includes Attested Computations for
data and operations work. Adopting those conventions would rewrite our records
and drop `openCatalog`.

## Decision

Align with OKF on principles only. Do not adopt OKF as the authoring format.
Do not rewrite existing records to OKF shape.

The principles we share:

1. Knowledge is Markdown with YAML frontmatter. It is git-diffable and readable
   by humans and agents. [ADR 0005](./0005-yaml-component-specs.md) later made
   component records plain YAML specs with generated narrative. The principle
   that survives is plain-text, git-diffable authoring.
2. Producer is not consumer. The authored corpus is owned by the design system.
   MCP servers, skills, CLIs, and any future OKF-shaped views are adapters, not
   sources of truth (KNOW-001, KNOW-016, KNOW-027).
3. Agents retrieve by progressive disclosure: summary, then a seed record, then
   related neighbors. They do not dump the corpus (KNOW-015).
4. Provenance is first-class on every compiled record (`sources`, KNOW-005).
5. Lifecycle is explicit and queryable (`status`), not buried in prose
   (KNOW-007, KNOW-012).

The source of truth remains `packages/knowledge/content/`, compiled to
`dist/public`, and retrieved through `openCatalog` (`get`, `list`, `search`,
`related`).

We will not adopt:

- free-form or unregistered `type` values; we keep a schema registry
- path-as-id; we keep dotted stable IDs
- untyped Markdown links as the graph; we keep typed `relations`, compiled
  backlinks, and `related()`
- skipping compile; we keep compile → `dist/public` + `openCatalog`
- Attested Computations; that is a data and operations concern, not this
  component corpus
- rewriting existing records to OKF shape

Deferred, and not implemented by this ADR:

- If agents later author or edit knowledge records, a future schema ADR may add
  optional trust or freshness fields inspired by OKF (`generated`, `verified`,
  `stale_after`, or our names).
- If an outsider later needs OKF-shaped files, an optional projection adapter
  may emit them from compiled public records. That adapter would still not be
  authoring.

## Consequences

- Authors and adapters keep the current record model. No schema, compiler,
  content, or retrieval change is required to accept this ADR.
- Reviewers can reject OKF-shaped authoring, path IDs, and untyped link graphs
  by pointing here.
- A later OKF projection or trust-field schema needs its own ADR. This one does
  not authorize those changes.

## Alternatives considered

**Adopt OKF as the authored format.** Rejected. It would replace dotted IDs,
typed relations, the schema registry, and the compile step that `openCatalog`
depends on.

**Ignore OKF.** Rejected. The overlapping principles are already our rules.
Recording the non-goals avoids a later rewrite "for compatibility."
