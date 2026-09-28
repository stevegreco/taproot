# Knowledge layer simplification plan

**Date:** 2026-09-28
**Status:** Proposed. This plan replaces the open work items in
[architecture-review-2026-09-04.md](architecture-review-2026-09-04.md).

## Goals

The knowledge package has two jobs. Judge every mechanism against them.

1. **A contract to build from.** Engineers build the web components from it. Designers build the
   Figma components from it. Both read the same parts, variants, states, tokens, and rules.
2. **One source of knowledge to serve.** Components, patterns, and guidelines reach the docs site
   and adopters' agents through `get`, `list`, `search`, and `related`, and later through an MCP
   server, a CLI, and an HTTP API. Of the two jobs, this one matters more.

## Why simplify

The package holds about 1,800 lines of authored content for five components on one platform. The
compiler and retrieval code is about 5,600 lines, the tests about 5,700, and the design docs about
1,600. That is roughly three lines of machinery per line of knowledge.

Most of the weight comes from four places:

- **A separate binding record for a platform split we only half use.** Contract and binding live in
  different files with different schemas and version numbers, yet the contract still uses CSS names
  such as `padding-inline` and `focus-visible`.
- **Small languages authors must learn.** `stateResolution` has overlay, suppress, and independent
  rules. The compact visuals syntax takes 771 lines to expand. Records can use seven relation verbs.
- **The same fact in several files.** Button's review guideline restates spec rules. Variant
  guidance appears in the spec, the action-hierarchy pattern, and the implementation guideline.
- **Hand-written metadata.** Authors copy two `specVersion` values and fill in `jobs`, `tags`, and
  `status` by hand. Nothing uses `status`.

## Principles

- **One fact, one file.** When two files say the same thing, delete one and link to the other.
- **Structured facts go in YAML. Prose goes in Markdown.** Component specs are YAML. Patterns,
  guidelines, and examples are Markdown. The build generates each component's Markdown page.
- **The contract uses neutral words.** Parts, variants, states, and tokens, named so a designer
  can build the Figma component from them. CSS names live in the component's `web:` section.
- **The build fills machine fields.** Authors never write version numbers. `jobs` and `tags` are
  optional and the build derives defaults.
- **Delivery is the product.** Generated Markdown, search, and the retrieval API get improved, not
  trimmed. Every future channel, whether MCP, CLI, or API, wraps the same four calls.
- **Keep what already works.** Token values stay in `packages/tokens`. Runtime stays in
  `packages/components`. Stable IDs, schema validation, visibility, and the contract tests stay.

## Target model

```
content/
  components/button/button.spec.yaml   contract + web section, one file per component
  patterns/*.md                        guidance across components
  guidelines/*.md                      how-to prose for one job
  examples/*.md                        annotated examples and their assets
```

A component file reads top to bottom by audience. Designers and writers stop before `web:`.

```yaml
# yaml-language-server: $schema=../../../src/schema/component.schema.json
id: component.button
type: component
title: Button
summary: Use Button to trigger an action or to submit or reset a form.
related:
  - component.link
  - pattern.action-hierarchy

contract:
  usage: ...            # do and avoid, for designers and writers
  content: ...          # label rules
  anatomy: ...          # parts
  parameters: ...       # variant, size, disabled
  states:               # priority order, first match wins; focus is always independent
    - disabled
    - pressed
    - hover
    - default
  behavior: ...         # rules, one severity scale: must, should, may
  accessibility: ...
  visuals:
    control:
      base:
        radius: component.button.radius
      size:
        md:
          padding-horizontal: component.button.size.medium.paddingInline
      ...

web:                    # everything specific to the web component
  package: "@stevegreco/design-system-components"
  tag: ds-button
  define: defineButton
  attributes: ...
  events: ...
  parts: ...
  formAssociation: ...
```

What changes, in one table:

| Today | After |
| --- | --- |
| `*.spec.yaml` plus `bindings/*.web-component.md` | One `*.spec.yaml` with a `web:` section |
| Three authored schemas | One component schema and one record schema |
| `stateResolution` with overlay, suppress, independent | `states` in priority order, focus independent |
| CSS channel names in the contract | Neutral names; the compiler maps them to CSS |
| Seven relation verbs | `related`, with backlinks derived by the build |
| Review `checks` with error and warning | Rules on the spec with must, should, may |
| Four version numbers | One compiled schema version, filled by the build |
| Required `jobs` and `tags`; unused `status` | Optional; the build supplies defaults |
| IDs on every usage bullet | IDs only on rules |

## How we work

- Merge `chore/knowledge-review-batches` first. Then branch `refactor/knowledge-simplification`
  from `main`.
- Make one commit per batch on that branch and open one PR at the end. The package has one
  consumer, so batches can change the compiled shape and update the consumers in the same commit.
- Bump the compiled schema version once, in the first batch that changes the compiled shape.
- Every batch ends green:

  ```bash
  pnpm exec turbo run build test --filter=@stevegreco/design-system-knowledge --filter=@stevegreco/design-system-components --filter=documentation
  ```

- Before batch 2, save a copy of `packages/knowledge/dist/public/records.json` outside the repo.
  Batches 2 and 3 compare their compiled `mappings` and generated component sources against it.

## Batches

### 1. Fixes that survive the redesign

- Sort by code unit everywhere. Replace the 22 `localeCompare` calls so output does not depend on
  the machine's locale.
- One mistake, one error. Recover the record ID when YAML fails to parse, and skip invalid records
  in every cross-record check (`checkVariantGuidance`, `checkRuleReferences`, relations).
- Every error names a file and line, including semantic errors that carry only a JSON pointer.
- Parse Markdown frontmatter with the same YAML parser as specs. Accept a leading BOM.
- Validate rule `fragment` anchors in the compiler. Report an unresolved reference once.
- Fix the doubled period in rendered examples and the corrupted body for a linked image.
- CI fails on untracked or deleted generated files: `git status --porcelain --untracked-files=all`.
  `build-sources.js` deletes generated files that no component owns.
- The rule census ignores `test.skip`, `test.todo`, and commented-out tests. Tag the existing
  Button `form-association` and Text field `form-value` tests.

Skip fixes inside `stateResolution` and the visuals overlap check. Batch 2 replaces that code.

### 2. A simpler contract

- Replace `stateResolution` with `states` in priority order: the first active state wins, and
  focus combines with any state. Model Checkbox's checked and indeterminate as a value parameter if
  the priority list cannot express them. Compiled mappings must match the saved baseline for all
  five components. If one cannot match, stop and revisit before continuing.
- Rename channels to neutral words, for example `padding-horizontal`, `padding-vertical`,
  `focus-ring`, `motion-duration`, `motion-easing`, and rename state `focus-visible` to `focus` and
  axis `prefersReducedMotion` to `reducedMotion`. One table in the compiler maps each name to CSS.
- Define the channel list once and derive the schema enum and compiler table from it.
- Delete the checks that can no longer fire: the shape checks in `expandVisuals`, most of
  `checkMappingAgreement`, and the ambiguity check in `resolveMappings`. Move the token-name check
  to where the authored path is known, so its error names the file and line.
- Remove `mappings` and `visualCoverage` from the authored schema. They exist only in compiled
  output.
- Emit rest-state rows the same way for every variant.

Done when compiled mappings match the baseline apart from the renames, and component CSS is
unchanged.

### 3. One file per component

- Move each binding's frontmatter into a `web:` section of its spec. Drop the host `specVersion`
  and `platform`. Delete `content/bindings/` and the `binding` record type.
- Fold `host-binding.schema.json` into the component schema as the `web` definition. Fold
  `portable-contract.schema.json` in as `contract`.
- The compiled component record carries `web`. Search for `ds-button` returns `component.button`.
- Update the consumers: `packages/components/build-sources.js`, `test/commands/*`,
  `host-checks.test.js`, and `apps/documentation/lib/component-knowledge.ts` and
  `component-pages.ts`.

Done when `content/bindings/` is gone, generated `src/*.d.ts` and `src/index.js` are byte-for-byte
unchanged, and the docs component pages render the same facts.

### 4. Less metadata, one place per fact

- Required fields become `id`, `type`, `title`, and `summary`. The build fills `schemaVersion`,
  defaults `status` to draft, derives `jobs` from type, and adds tags from the ID, title, and
  related records to any authored tags.
- Replace all relation verbs with `related`. Generated pages group links by the target's type.
  Remove the duplicate `uses` and `guides` lists from action-hierarchy; `variantGuidance` stays.
- Fold Button's review checks into spec rules where they are new, and delete the restated ones.
  Remove `checks` and the error and warning scale. Keep `button-review.md` only if prose remains that
  no other file says.
- Make usage bullet IDs optional.
- Variant guidance lives in one place per scope. The spec owns one component's variants. The pattern
  owns choices across components. The implementation guideline links to both.
- Content fixes:
  - Add "a non-empty error blocks form submission" to the Text field and Checkbox specs.
  - Remove "10px" from `checkbox.spec.yaml` rationale.
  - Give hint parts a `description` role.
  - Replace "a link" with the Link component in the Button guidelines, and relate them.
  - Update the stale action-hierarchy example in `content-model.md`.

### 5. Output for docs and agents

- Component Markdown gains these sections:
  - Install and register: package, CSS import, `define` call.
  - Anatomy, with parts and slots.
  - States.
  - Events, with descriptions.
  - Rules, with levels.
  - Tokens, with their CSS custom property names.
  - Related, grouped by type.
- Pattern and guideline pages render their rules. Example pages use the asset's alt text and render
  its annotations.
- Public pages carry no repo paths or maintainer notes. Move those parts of `compose-or-propose` to
  internal content, and replace jargon such as "FACE" and "effectively-disabled".
- Export `./markdown/*`, `./assets/*`, and `./package.json`. Add the bundle root to `catalog.info`
  and a `markdownPath(id)` helper. The docs site uses them instead of `dirname(manifest)`.
- Search:
  - Stem plurals and `-ing` forms.
  - Add question words such as "how" and "do" to the stopwords.
  - Weight rare terms above common ones.
  - Index IDs and tag names whole, so `ds-button` stays one term.
  - Break ties by type: component, then pattern, guideline, and example.
- The loader verifies the manifest digest, and its missing-file hint makes sense for an installed
  package.
- The docs projector fails when a field its page needs is missing, instead of rendering blanks.
- Add a search-quality test from the review's queries, for example "links" returns
  `component.link` first and "status indicator" returns `component.badge` first.

### 6. Authoring in an editor

- Add a `yaml-language-server` header to every spec and a `yaml.schemas` entry in
  `.vscode/settings.json`, so authors get autocomplete and inline errors.
- Make the authored schemas resolvable by editors, with relative `$ref`s instead of URNs.
- Split `new-component.md` into "write the spec", for designers and writers, and "build and test
  it", for engineers.
- Shrink the README glossary to the terms that remain.

### 7. Enforcement

- Host checks for every component:
  - Events are suppressed while disabled.
  - Every declared part renders.
  - A required slot exists.
  - `form` returns the owning form.
  - Enter and Space activate where the spec says so.
- Render each state alone and each pair that the priority rule resolves, plus focus with every
  state.
- Add the missing Link `standalone-underline-on-hover` test.
- Read the invalid-state driver from the `web:` section instead of assuming a parameter named
  `error`.

### 8. Docs

- Write ADR 0007, "Simplified knowledge model". Mark the parts of ADRs 0002 to 0005 it replaces.
- Update `content-model.md`, `requirements.md`, the package README, and the CHANGELOG.
- Update the create-component skill:
  - `SKILL.md` and the checklist.
  - `gotchas.md`: drop the build-race and `turbo.json` advice.
  - `status.mjs`: read the tag from `web:`, confirm generated files are tracked, and fix the
    reduced-motion warning.
- Mark `architecture-review-2026-09-04.md` as superseded, and mark this plan done.

## After this plan

In rough order of value:

1. **Foundation records** for color, type, and spacing meaning, so an agent can answer "which color
   means danger?".
2. **An MCP server and a CLI** over `get`, `list`, `search`, and `related`.
3. **A `figma:` section** on each component, with the file link and property names.
4. **A Figma check** that compares the Figma component's properties with the contract.
