# ADR 0006: Hosted MCP server

**Status:** Accepted
**Amends:** [ADR 0003](0003-knowledge-delivery.md), which put remote delivery out of scope and chose
no compiled format.

## Context

The local MCP server needs the repository or an installed package, a terminal, and Node. An agent
without those cannot read the spec, so the system also needs a server at a web address.

Hosts such as Cloudflare Workers do not offer what the local server relies on. A Worker has no file
system to read content from, no folder to watch, and no way to start a process. The system starts on
Cloudflare to learn the platform and may try Vercel later, so a hosted server must not tie the spec
to one host.

## Decision

**One server core, one small adapter per host.** The tools, their descriptions, and their output stay
in `packages/spec`. A shared HTTP connection there uses the MCP SDK's standard web request and
response handler, which runs on Workers and on Vercel. `apps/mcp` holds one small entry file per host.
`packages/spec` never depends on a host.

**Ship a snapshot.** A build script loads the spec with the same library as every other consumer and
writes one JSON file with the records, links, implementation mappings, token values, and system-wide
constants. It is plain JSON, not a graph database or a graph format. The file is made during the
hosted build and is not committed or published.

**A narrow exception to "no compiled format".** The snapshot applies only to hosted deploys. The CLI,
the local MCP server, and the docs site keep reading the source files, so an edit still shows up
immediately there.

**Same answers as the source.** A parity test compares answers from the snapshot with answers from
reading the files.

**Read-only and stateless.** The hosted server leaves out `validate`, which checks source files, and
does not reload. It keeps no session between requests. A new deploy is the only way its content
changes. It needs no sign-in, because everything it serves is already public in the npm packages.

**Only what people can install.** A hosted deploy serves the web implementation mappings. It leaves
out React while the React package is unpublished, so an agent is never told to import a package it
cannot install. The snapshot format has no limit on implementations, and adding React back is one
line in the hosted build.

## Consequences

- The ADR 0003 worry returns only for the hosted server: its content can be behind `main` until the
  next deploy. The snapshot is rebuilt on each deploy, and it has no public format, so it needs no
  version policy.
- The tools must run from loaded data, with no file system. The local server's behavior does not
  change.
- Each new host costs one small entry file and a project on that host.
- Agents have two ways to read the spec. The hosted server always shows the latest deployed content,
  and an installed package gives a pinned version with the CLI and `validate`.

## Alternatives considered

**Publish the snapshot for every consumer.** The local tools would need a build and a version policy,
which ADR 0003 rejected. Rejected.

**Read the source files from storage or GitHub at request time.** Each request would depend on another
service, and the file-reading code would still have to change for the host. Rejected.

**Run the Node server on an always-on host.** It would need the fewest code changes, but it costs
more to run and does not teach the serverless platforms this work set out to try. Rejected.

**Write the server separately for each host.** The tools would drift apart. Rejected.

**A graph database or graph format for the links.** Links already fit in plain JSON, and the corpus is
small. Rejected.
