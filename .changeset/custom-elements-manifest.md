---
"@taproot-ds/web-components": minor
---

Ship a custom elements manifest, `dist/custom-elements.json`, and point to it with `customElements` in `package.json`. IDEs and framework tools read it for each element's attributes, properties, events, slots, and CSS parts. It is generated at build time from the implementation API tables and the spec, so it matches `taproot get <name> --impl web`.
