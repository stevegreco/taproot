---
name: review-design-system
description: >
  Review a product design, screenshot, mock, or UI implementation against Ember & Sage
  knowledge records (components, patterns, guidelines, examples, and structured review
  checks). Use for design-system audits, multi-agent screen reviews, and compliance
  checks against published guidance. Do not use to verify this repository's documentation
  site or token builds (use verify-design-system) or to choose tokens while implementing
  (use design-tokens).
---

# Review product UI against Ember & Sage

This skill is a procedure. Portable design system facts live in the compiled knowledge
bundle, not here (KNOW-026, KNOW-010). Retrieve records through
`openCatalog` from `@stevegreco/design-system-knowledge/retrieve`. Do not paste Button
rules, pattern prose, or token policy into this skill, an agent prompt, or a memory file.

The first content slice is small on purpose. A useful review still runs: it applies the
records that exist, and it names everything else as unguided. Unguided is a first-class
result, not a failure of the review.

## Not this skill

| Need | Use |
| --- | --- |
| Prove this repo's Blume docs, labs, token build, or web components | `.cursor/skills/verify-design-system` |
| Choose a published token while implementing | `.agents/skills/design-tokens` |
| Audit token file architecture in the abstract | `design-token-auditor` only after reading token ADRs; that agent is generic and can conflict with Ember & Sage policy |

Token facts and ADRs stay in `packages/tokens`. Component contracts stay on component
records. This skill never restates them.

## Evidence

Declare one subject class before scoring:

| Class | Examples | Typical limits |
| --- | --- | --- |
| `design-artifact` | Figma, screenshot, mock, annotated example | Cannot verify focus rings, form `type`, disabled activation, or computed token use |
| `source` | Product markup, CSS, component usage | Cannot verify visible focus or realized contrast without a render |
| `rendered` | Running app or docs preview | Strongest for interaction, focus, and disabled behavior |

A source-only or mock-only review must use `cannot-verify` when the check requires
evidence the subject does not contain. That is not a pass. Review guideline bodies
already say this; believe them.

## Workflow

Run from the repository root. Build the knowledge package if `packages/knowledge/dist/public`
is missing:

```bash
pnpm --filter @stevegreco/design-system-knowledge build
```

### 1. Observe the subject

Inventory visible decisions without scoring yet:

- screens and tasks
- action groups (controls that resolve the same decision)
- components and patterns that appear to be in play
- labels, emphasis, destructive actions, status, empty and disabled states

Write the inventory in the report. Guessing a component name is allowed here; applying a
rule is not, until a record is attached.

### 2. Freeze a review pack

Build one pack and share that exact JSON with every reviewer. Do not let each agent
search the corpus independently.

```bash
node .agents/skills/review-design-system/scripts/review-pack.mjs \
  --subject design-artifact \
  --query "settings actions buttons"
```

Useful flags:

- `--id component.button` (repeatable) seeds from known records
- `--query "..."` seeds from catalog search
- `--subject design-artifact|source|rendered` (`design-artifact` keeps `design`/`review` jobs and omits host bindings)
- `--bundle packages/knowledge/dist/public` to open a copied bundle
- no seeds → every record with `jobs` including `review`, plus one-hop neighbors

Record `catalog.digest`, `knowledgeVersion`, and `designSystemVersion` in the report.
If two agents used different digests, the reviews are not mergeable.

### 3. Map inventory to records

For each inventoried item, attach zero or more pack record IDs:

- a matching `component.*` contract (`usage.do` / `usage.avoid`)
- a matching `pattern.*`
- a `guideline.*` whose `relations.reviews` include those records
- an `example.*` whose annotations demonstrate the same decision

Then classify coverage:

- **guided:** at least one applicable component, pattern, or review check
- **unguided:** observed UI with no matching published record

A component can exist and still be unguided for review. Today `component.badge` has a
contract and no `backlinks.reviewedBy`. Score Badge against its contract only, and list
the missing review guideline as a knowledge gap.

### 4. Apply records in this order

1. Structured `checks[]` on review guidelines (stable IDs; `error` or `warning`)
2. Component `contract.usage`, `behavior`, and `accessibility.requirements` when no
   check covers the same requirement
3. Pattern body (when to use, when to avoid, composition)
4. Example annotations as comparators, never as extra rules

Prefer a check ID over restating the same requirement from contract prose. One finding
per requirement.

Status policy:

- `accepted` binds
- `draft` binds for this slice, but mark the finding `recordStatus: draft`
- `deprecated` and `superseded` do not bind; mention them only when the subject still
  follows the old guidance

### 5. Score, then stop

Valid verdicts:

| Verdict | Meaning |
| --- | --- |
| `pass` | Evidence shows the check holds |
| `fail` | Evidence shows the check does not hold |
| `not-applicable` | The check's situation is not in the subject |
| `cannot-verify` | The check applies, but this evidence class cannot show it |
| `unguided` | Observed UI with no published record to apply |

Do not invent Nielsen, Material, Apple HIG, or generic “best practice” as pass/fail.
Those may appear only under `knowledgeGaps` as questions the corpus does not answer.

Do not treat “the mock looks fine” as token compliance. Token checks need source or
computed styles, and they follow token ADRs rather than resolved hex values.

## Multi-agent protocol

Use this shape even when one agent plays every role. Multi-agent is for independent
scoring of a frozen pack, not for competing opinions from training data.

1. **Orchestrator** observes the subject, builds and freezes the pack, maps coverage,
   and assigns each check ID to exactly one lens (`lenses.md`).
2. **Lens agents** receive: the subject, the frozen pack JSON, their assigned check IDs,
   and the evidence class. They may cite only pack record IDs. They must score every
   assigned check. They must not add checks, drop checks, or review unguided surfaces.
3. **Coverage agent** (optional, single) lists unguided inventory. No other lens reports
   unguided findings.
4. **Synthesizer** merges by `checkId`:
   - one verdict → keep it
   - pass + fail → `conflict`, keep both evidence, do not average
   - missing assigned check → `cannot-verify` with note `lens-omitted`
   - attach coverage and knowledge gaps
   - emit one report that matches `report.schema.json`

Spawn lens agents in parallel. Give them the pack file or inline JSON, not a request to
“look up the design system.”

When the pack has a single review guideline and one screen, one agent may run every lens
sequentially. The report shape stays the same.

## Report

Write JSON that validates against
[`report.schema.json`](report.schema.json), then a short human summary:

- what was reviewed and the evidence class
- catalog digest and records used
- guided vs unguided surfaces
- failures and conflicts, each citing a check or record ID
- knowledge gaps (missing components, patterns, or review checks)

Do not include a numeric design-system “score.” Coverage plus check verdicts are the
result.

## Growing the corpus

If a review needed guidance that does not exist, propose a knowledge record (pattern,
guideline with `checks[]`, example) in the knowledge package. Do not patch the missing
rule into this skill.

The committed example `example.action-hierarchy.settings` is the positive comparator for
the current slice. Use it to calibrate action-group reviews, not as a layout or density
template.

Helper tests:

```bash
node --test .agents/skills/review-design-system/scripts/review-pack.test.mjs
```
