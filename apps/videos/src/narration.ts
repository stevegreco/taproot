// One continuous performance. Sections identify picture changes, not audio edits.
export const VOICE_ID = "r1KmysJdVYZjJCm4mL3b"; // Jessica
export const MODEL_ID = "eleven_v4";
export const NARRATION_SEED = 42;
export const AUDIO_START = 0.25;

// Eleven v4 has no SSML breaks. Delivery comes from one tag that sets the tone for the whole take,
// ellipses, and short sentences. Keep a single `delivery` on the opening line: a tag on every section
// makes the voice change mood between scenes and sound performed.
// `hold` is silence, in seconds, added after a section so the picture can land. The take itself
// is never cut mid-sentence; playback is split only between sections.
// Write for someone new to design systems: plain words, no internal names, and talk to the viewer.
export const narration = [
  {
    id: "01-opening",
    delivery: "warm",
    text: "Your design system has a new kind of reader... and it isn't a person.",
    hold: 0.4,
  },
  {
    id: "02-scattered",
    text: "Today, how a button looks lives in Figma. How it works lives in code. And why it works that way? That's usually in someone's head.",
    hold: 0.6,
  },
  {
    id: "03-mistake",
    text: "A new teammate would just ask around. An AI assistant can't. So it guesses... and you get something that looks right, but isn't.",
    hold: 1.0,
  },
  {
    id: "04-spec",
    text: "A spec fixes that. Think of it as the instructions that come with every component, written in plain language instead of code. It spells out what a component is made of, what it can do, every state it can be in, the exact colors and sizes it uses... and the rules for using it well.",
    hold: 0.6,
  },
  {
    id: "05-links",
    text: "Each component also points to the bigger picture: the patterns it follows, the guidelines behind it, and real examples. So the why never gets lost.",
    hold: 0.6,
  },
  {
    id: "06-rules",
    text: "Every rule is labeled, too. Must, or should. So an assistant can find the exact rule... and tell you which one it followed.",
    hold: 0.5,
  },
  {
    id: "07-validate",
    text: "And it's all checked automatically, so nothing goes stale as the system grows.",
    hold: 0.6,
  },
  {
    id: "08-agent",
    text: "So let's watch it work. You ask an assistant to add a delete button. Instead of guessing, it looks things up first, and reads the rules for buttons. It marks the button as dangerous, because deleting can't be undone. It says Delete project, not just Remove. And it keeps it apart from the everyday buttons. Every choice is backed by a rule you can check.",
    hold: 1.2,
  },
  {
    id: "09-audit",
    text: "It works on what you already have, too. Point an assistant at an existing screen, and it checks it against the same rules. It flags what breaks a must, notes what misses a should... and tells you exactly which rule, so a review isn't a matter of opinion.",
    hold: 0.8,
  },
  {
    id: "10-shared",
    text: "Design tools, component libraries, docs, and AI assistants all work from the same source... so everyone builds the same thing.",
    hold: 0.6,
  },
  {
    id: "11-close",
    text: "Write the reasons down once. Then everyone, and everything, can follow them.",
    hold: 0,
  },
] as const;

// Phrases that move the picture: scattered sources, spec sections, links, the agent's steps and
// decisions, and the rules reaching each output. Each phrase matches its first occurrence in the
// take, so keep it unique.
export const narrationCues = {
  figma: "in Figma",
  code: "in code",
  head: "someone's head",
  parts: "is made of",
  options: "what it can do",
  states: "every state",
  tokens: "colors and sizes",
  rules: "the rules for using",
  patterns: "the patterns it follows",
  guidelines: "the guidelines behind",
  examples: "real examples",
  levels: "Must, or should",
  cite: "tell you which",
  checked: "checked automatically",
  search: "looks things up",
  read: "reads the rules",
  emphasis: "as dangerous",
  label: "Delete project",
  placement: "apart from",
  verified: "backed by a rule",
  scan: "existing screen",
  must: "breaks a must",
  should: "misses a should",
  which: "exactly which rule",
  design: "Design tools",
  libraries: "component libraries",
  docs: "docs, and",
  agents: "and AI assistants",
} as const;
