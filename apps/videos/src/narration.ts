// One continuous performance. Sections identify picture changes, not audio edits.
export const VOICE_ID = "Fahco4VZzobUeiPqni1S"; // Archer
export const MODEL_ID = "eleven_v4";
export const NARRATION_SEED = 42;
export const AUDIO_START = 0.25;

// Eleven v4 has no SSML breaks. Delivery comes from audio tags, ellipses, and short sentences.
// `delivery` opens a section with a tag; inline tags such as [sighs] sit inside `text`.
// `hold` is silence, in seconds, added after a section so the picture can land. The take itself
// is never cut mid-sentence; playback is split only between sections.
export const narration = [
  {
    id: "01-opening",
    delivery: "warm",
    text: "AI is changing who reads your design system.",
    hold: 0.4,
  },
  {
    id: "02-scattered",
    text: "The visuals are in Figma... the behavior's in code... and the reasons behind it? Those are in someone's head.",
    hold: 0.6,
  },
  {
    id: "03-mistake",
    delivery: "thoughtful",
    text: "People fill in those gaps without thinking. An agent can't. It builds something that looks right... [sighs] but misses the point.",
    hold: 1.0,
  },
  {
    id: "04-spec",
    delivery: "confident",
    text: "That's where a component spec comes in. It's a contract, written once, with no code in it. The parts. The options. The states. The tokens. And the rules.",
    hold: 0.6,
  },
  {
    id: "05-links",
    text: "And it doesn't stand alone. Each component links to the patterns, guidelines, and examples around it... so the reasons travel with the rules.",
    hold: 0.6,
  },
  {
    id: "06-rules",
    text: "Every rule gets an address, and a level, like must or should. So an agent can look it up... and cite it.",
    hold: 0.5,
  },
  {
    id: "07-validate",
    text: "It's all checked, too. Every link, every reference... so the spec stays true as it grows.",
    hold: 0.6,
  },
  {
    id: "08-agent",
    delivery: "curious",
    text: "So what happens when you ask an agent to add a delete action? It searches the spec, and reads Button and the action hierarchy pattern. Then it decides. Danger, because it's destructive. A label that names the result. A place apart from routine actions. [confident] Every choice cites a rule.",
    hold: 1.2,
  },
  {
    id: "09-shared",
    delivery: "warm",
    text: "Design tools and component libraries build from the same spec. Docs and agents read it, through a CLI and MCP.",
    hold: 0.6,
  },
  {
    id: "10-close",
    text: "So... give agents the rules behind the components.",
    hold: 0,
  },
] as const;

// Phrases that move the picture: scattered sources, spec sections, links, the agent's steps and
// decisions, and the rules reaching each output.
export const narrationCues = {
  figma: "in Figma",
  code: "in code",
  head: "someone's head",
  parts: "The parts",
  options: "The options",
  states: "The states",
  tokens: "The tokens",
  rules: "And the rules",
  patterns: "the patterns",
  guidelines: "guidelines",
  examples: "examples around it",
  levels: "must or should",
  cite: "and cite it",
  checked: "Every link, every reference",
  search: "It searches the spec",
  read: "reads Button",
  emphasis: "Danger, because",
  label: "A label that names",
  placement: "A place apart",
  verified: "Every choice cites a rule",
  design: "Design tools",
  libraries: "component libraries",
  docs: "Docs and agents",
  agents: "agents read it",
} as const;
