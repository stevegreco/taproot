---
"@taproot-ds/spec": minor
"@taproot-ds/web-components": patch
---

An implementation folder's `README.md` now holds the setup every component of that implementation shares: installing the package, loading its styles and the optional page defaults, fonts, and registering elements. `taproot setup --impl <name>` and the MCP `setup` tool print it, the hosted snapshot carries it, and `get --impl` ends with a line pointing to it. The web implementation files no longer repeat the token stylesheet paragraph.
