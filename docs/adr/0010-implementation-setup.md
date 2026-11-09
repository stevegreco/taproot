# ADR 0010: Implementation setup lives once per implementation

**Status:** Accepted
**Amends:** [ADR 0003](0003-spec-delivery.md) and [ADR 0007](0007-agent-first-surfaces.md).
Follows [#308](https://github.com/stevegreco/taproot/issues/308).

## Context

An implementation file maps one component's API and holds guidance specific to that component.
Setup that every component shares had no home of its own: installing the package, loading the
token stylesheet, the optional page defaults, fonts, and registering elements. So each file
repeated it. All 20 web files and the scaffold carried the same Styles paragraph, the 8 React files
another, and adding the base stylesheet for #308 would have meant editing all 28 again.

Agents read `get <component> --impl <name>`, so the repeated text did reach them. But a copy that
drifted, or a new component that skipped it, went unnoticed, and a `batch` of five lookups printed
it five times.

## Decision

**Each implementation folder may hold a `README.md` with the setup its components share.** It is
not a component file: `loadImplementations` skips it, and nothing checks it against a record. It
is plain Markdown, so GitHub shows it when someone browses the folder.

**`taproot setup --impl <name>` prints it**, and the MCP server has a `setup` tool with a required
`implementation`. The hosted snapshot carries it. A configured implementation without the file
fails with `ERR_NO_SETUP`.

**`get --impl <name>` ends with one line pointing to it**, rather than repeating the text, so a
single lookup still leads to the setup and a batch does not repeat it.

**Component files keep only component-specific guidance.** The scaffold no longer writes a Styles
section. A file adds one only for styling advice about that component, such as Button's warning
about `::part(button)`.

## Consequences

- Setup changes in one file per implementation.
- The agent instructions name `setup` as a once-per-project read.
- An agent that reads only one component and ignores its closing lines misses the setup. The
  pointer line and the agent instructions are the mitigation.
- The README name is a convention, not a config field. A project that wants another name can add a
  config field later; nothing here prevents it.
