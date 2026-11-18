---
"@taproot-ds/spec": minor
"@taproot-ds/web-components": patch
---

With no `spec.config.json`, the `taproot` CLI and local MCP server now configure themselves from the installed `@taproot-ds/web-components` and `@taproot-ds/tokens` packages, so `get --impl web`, `setup --impl web`, and `tokens --resolve` work in a new project with no config file. The web setup (`taproot setup --impl web`) now also installs `@taproot-ds/spec` and connects the project's agents: their instructions and the MCP server.
