/**
 * How an agent should use the spec. The MCP server sends this text as its instructions,
 * `taproot help agents` prints it, and AGENTS.md carries a copy that a test keeps equal.
 */
export const AGENT_INSTRUCTIONS = `The design system spec holds records: components, patterns, guidelines, and examples. A component
is a technology-neutral contract (anatomy, parameters, states, rules, tokens), not framework code.
Implement it in whatever technology the project uses.

- Use the \`taproot\` CLI when you have a terminal, and the \`taproot\` MCP server when you
  do not. Run the CLI from an installed copy, never an \`npx\` download per call: in this repository,
  \`node packages/spec/bin/taproot.js\`; in a project that depends on the package,
  \`node_modules/.bin/taproot\`.
- Start with \`search\` to choose a component, then \`get\` it and follow its links: \`alternative\` for
  when it is the wrong choice, \`follows\` for the patterns and guidelines it applies, \`examples\` for
  worked usage.
- Use \`rules\` to review work, and cite each rule by its address (for example
  \`component.button#label-describes-result\`) with its level (MUST, SHOULD, MAY). A component's
  rules include those of the patterns and guidelines it follows, at their own addresses (for
  example \`pattern.form-field#error-blocks-submit\`).
- Use \`tokens\` for the design tokens a component part uses in a variant or state. Add \`--resolve\`
  (MCP: \`resolve\`) for values. Use \`format\` for what records do not repeat: the system-wide
  constants, such as border width and focus-ring width and offset, with their tokens.
- Before writing code, \`get\` the component with the implementation for your technology:
  \`--impl web\` for web components, \`--impl react\` for React (MCP: \`implementation\`). It gives the
  package, what to import, and the attribute or prop that implements each parameter. Never derive
  those names from parameter names.
- Components style only themselves. Before building a page, \`get guideline.page-setup\` for the
  page's base font, text color, background, and heading recipes, and load the base stylesheet it
  names when your technology has one.
- For several lookups, run them in one \`batch\` with the CLI (for example
  \`taproot batch --command "get button --impl web" --command "tokens button"\`), or make the
  tool calls in parallel on the MCP server.`;
