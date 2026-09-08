# Review lenses

Lenses partition **check IDs**, not aesthetics. The orchestrator assigns every check in
the frozen pack to exactly one lens before spawning agents. A later guideline adds new
IDs; assign those IDs here rather than restating their requirements.

When a new review guideline lands, add a mapping. Do not let two lenses score the same
ID.

## Assignment rules

1. If the check ID is listed below, use that lens.
2. Otherwise assign by owning guideline tags:
   - `accessibility` → `accessibility`
   - `hierarchy`, `destructive`, `action` (pattern composition) → `composition`
   - `implementation`, `form` → `contract`
   - token or theming checks → `tokens`
3. If still ambiguous, `contract` owns component-parameter checks; `composition` owns
   multi-control checks.
4. Bindings and host names are in scope only for `contract` on `source` or `rendered`
   subjects. Design-artifact reviews stay on the portable contract.

## Current slice

Owning guideline: `guideline.button-review`.

| Check ID | Lens | Design-artifact note |
| --- | --- | --- |
| `button-review-semantics` | `contract` | Usually verifiable from labels and placement |
| `button-review-hierarchy` | `composition` | Verifiable from action groups |
| `button-review-danger` | `composition` | Verifiable from action intent and grouping |
| `button-review-label` | `accessibility` | Visible text only; accessible name may be `cannot-verify` |
| `button-review-form-type` | `contract` | `cannot-verify` on mocks unless type is labeled |
| `button-review-disabled` | `contract` | Reason may be visible; activation is `cannot-verify` without a render |
| `button-review-focus` | `accessibility` | `cannot-verify` on mocks and source |
| `button-review-tokens` | `tokens` | `cannot-verify` on mocks |

`component.badge` has no review checks yet. `contract` may apply Badge `usage` and
accessibility requirements. `coverage` reports the missing `reviewedBy` guideline.

## Lens prompts

Each lens agent is read-only. It does not edit the product or the knowledge corpus.

Shared constraints for every lens:

- Score only the assigned check IDs.
- Cite pack `recordId` values. Do not quote training data as a rule.
- Use verdicts `pass`, `fail`, `not-applicable`, `cannot-verify`.
- Put evidence next to each check: what was seen, and where.
- If the pack record is `draft`, set `recordStatus` to `draft`.
- Return JSON findings only, no architecture essay.

### composition

You review grouping, emphasis, and destructive separation against pattern records in the
pack (today: `pattern.action-hierarchy` and the checks in the table). Compare with
example annotations when present. Do not score color contrast, focus, or tokens.

### contract

You review whether the subject uses the component for the situations in `contract.usage`,
and whether parameters and behavior match the assigned checks. On `design-artifact`
subjects, ignore `tagName`, slots, parts, and FACE. On `source` or `rendered` subjects,
the binding record may confirm host mapping. Do not score action-group hierarchy.

### accessibility

You review accessible naming, focus indication, and “meaning does not depend on color
alone” only when those requirements appear in assigned checks or, for components with no
review guideline, in `contract.accessibility`. Do not invent WCAG clause numbers that
are not in the pack.

### tokens

You review token-tier intent against the pack `tokenRef`, the design-tokens skill, and
token ADRs named in record `sources`. Fail product CSS that recreates a published
component variant. Do not fail a component token for aliasing a primitive when the token
ADR allows it. Do not score hierarchy.

### coverage

You do not score checks. You list inventoried surfaces that have no matching pack record,
and components or patterns in the pack that lack `backlinks.reviewedBy`. Each unguided
item becomes a `knowledgeGaps` entry or an `unguided` finding, not a fail.
