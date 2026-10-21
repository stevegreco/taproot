---
name: spec-component
description: Propose a new component for the Ember & Sage design system as a minimal draft spec in packages/spec, before anyone implements it. Use when asked to propose, spec, or start a new component such as Alert, Tabs, or Tooltip, or when reviewing a draft component spec. This is the first of three phases; implement-component and document-component follow.
---

# Spec a component

The first of three phases, one commit each in a single pull request:

1. **spec-component** (this skill): a draft spec that says what the component is for.
2. **implement-component**: completes the spec contract and builds the web component.
3. **document-component**: the docs example and its Verify steps.

All three phases are commits on one branch off `main`, in one pull request. Review pauses
after each commit, and the next phase starts only once that commit is reviewed. The pull request
merges after the docs commit, so a draft or an undocumented component never reaches `main`.

A draft is small on purpose. It is the proposal people review before anything is built, so it
holds only what the schema requires. Parameters, rules, tokens, and rationale come in the
implementation phase, when there is something to decide them against.

## 1. Confirm the need

```bash
pnpm spec get guideline.compose-or-propose
pnpm spec search "<what the component does>"
```

Compose existing components where you can. Propose a new one only when the guideline says so. If a
record already covers the need, stop and say which one.

## 2. Write the draft

```bash
pnpm component:new <name> --phase spec
```

This writes `packages/spec/content/components/<name>/<name>.spec.yaml` with the schema header,
`status: draft`, and a `TODO:` placeholder for each field a draft needs. It refuses to overwrite a
record that exists. Replace every placeholder; `pnpm spec validate` reports each one left. The
format is in `packages/spec/SPEC.md`. A filled-in draft looks like this:

```yaml
# yaml-language-server: $schema=../../../src/schema/spec-record.schema.json
id: component.<name>
type: component
title: <Title>
summary: Use <Title> to … # one sentence that says when to use it
status: draft
description: >-
  What it shows or does, in a sentence or two.
usage:
  do:
    - A concrete situation it is for.
  avoid:
    - situation: A situation it looks right for but isn't.
      instead: component.<other> # a record ID where one exists, otherwise plain text
      why: Why the other choice fits better.
anatomy:
  <part>:
    role: container
    description: What this part is.
```

The scaffold names one part, `container`. Rename it and add a part for each named piece, in
reading order.

- `status: draft` is required. The docs tests fail when a spec that is not a draft has no
  implementation file.
- Technology-neutral. No element, attribute, slot, framework, or CSS names, and no code. If you want
  to write one, it belongs in the implementation phase.
- `avoid` entries are where most of the thinking goes: they say where this component stops and its
  neighbors start. Point `instead` at a record ID where one exists.
- Add `links.follows` for patterns and guidelines the component applies, and `links.related` for
  close neighbors, when they are clear now.
- Leave out parameters, rules, tokens, and rationale unless one is the reason the component exists.
  Note open questions in the pull request instead.
- Do not edit other components' records to point at this one yet. A draft is not built, so agents
  should not be sent to it. That happens in implement-component.

## 3. Check

```bash
pnpm spec validate
pnpm spec get component.<name>
pnpm component:status <name> --phase spec
```

`get` shows the draft status note. `validate` reports each mistake once, with file and line,
including any `TODO:` left. A link or `instead` that names a record must resolve, and a section target (a heading slug, rule ID, or field path such as
`parameters.variant.danger`) must exist.

## Pull request

Branch from `main`, commit the draft, and open the pull request with this commit. Ask for review
and stop: the implementation commit starts only after the draft is reviewed. The description says:

- What the component is for, and why composing existing components is not enough.
- Its boundaries: the `avoid` entries in a sentence each.
- Open questions for the implementation phase, especially any that change public API.
