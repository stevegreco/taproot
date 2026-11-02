# React implementation research

This log goes with `packages/react`, a second implementation of the spec built in React. The work
tests two claims:

1. The spec can support components written in a technology other than web components.
2. The spec alone is enough to build a new implementation of an existing component.

Component behavior belongs in the spec records. This document records what building from them
showed.

## Method

- **Spec-only implementers.** Each component is built by a fresh agent that may read only `ds-spec`
  output (`get`, `rules`, `tokens`, `links`) and the published tokens. It never reads
  `packages/components` or the web implementation files. Every guess it makes, and every time it
  needs something the spec does not say, goes in the log below.
- **Review.** The integrating agent checks each component against `rules <id>` and records a
  finding for every MUST or SHOULD rule that was missed, misread, or impossible to verify.
- **Approach bake-off.** Tabs is built three ways (native React, Base UI, React Aria Components)
  before the package commits to one approach. Each is scored on rules met, code size, how the token
  styling fits, and how directly its API maps to the spec's parameters, events, and items.

## Findings

Each finding names the area it would change (spec, implementation, tooling, docs, or process) so it
can become a labeled issue at the end.

### Setup

- **The implementation-file format only fits web components.** _Tooling._ `tagName` is required
  and must contain a hyphen, `defineExport` is required, and an API row can only be an attribute,
  property, or event. A React component has a PascalCase name, no registration function, and props,
  callback props, and children. The generated usage section also assumes a custom element. Adding a
  second implementation to `spec.config.json` works, and `get --impl react` reports that nothing is
  implemented yet, so the gap is the file format, not the lookup.
- **`component:status` assumes web is the only implementation.** _Process._ It checks fixed
  `packages/components` paths, so it cannot report the state of a React port or of a component that
  exists only in React.
- **A configured implementation folder that does not exist crashes the CLI.** _Tooling._ Before
  the folder existed, `get tabs --impl react` printed a raw `ENOENT: no such file or directory`
  error instead of saying nothing is implemented. The folder now holds a `.gitkeep`.
- **CLI tests read the repository's own `spec.config.json`.** _Tooling._ Two tests asserted that
  `web` was the only configured implementation, so adding `react` broke them. They now expect both;
  a fixture config would keep them independent of the repository's setup.

## Bake-off: Tabs

Not started.

## Components

Not started.
