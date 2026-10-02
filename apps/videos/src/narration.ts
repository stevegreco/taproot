// The voiceover for `KnowledgeLayer`, one line per picture. `start` is in seconds from the start of
// the composition and should sit just after the chapter it describes begins. `scripts/narrate.mjs`
// turns each line into `public/narration/<id>.mp3`; `narration.md` explains the delivery.
export const VOICE_ID = "nPczCjzI2devNBz1zQrb"; // ElevenLabs premade "Brian"
export const MODEL_ID = "eleven_multilingual_v2";

export const narration = [
  { id: "01-opening", start: 0.4, text: "AI changes who reads your design system." },
  {
    id: "02-scattered",
    start: 3.4,
    text: "Visuals, behavior, and decisions live in different places. People connect the dots. Agents guess.",
  },
  { id: "03-mistake", start: 10.3, text: "And a plausible guess can still be wrong." },
  {
    id: "04-rules",
    start: 15.3,
    text: "A spec writes the rules down once. Each rule has an ID and a level, so every answer can be cited.",
  },
  {
    id: "05-shared",
    start: 23.3,
    text: "Design tools, component libraries, documentation, and agents all read the same spec.",
  },
  {
    id: "06-agent",
    start: 30.4,
    text: "Now the agent asks first. It chooses danger emphasis, names the result, and separates the action. And it cites the rule behind each choice.",
  },
  { id: "07-close", start: 41.3, text: "Give agents the rules behind the components." },
] as const;
