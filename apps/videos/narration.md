# Design system spec narration

Script for the 45-second `KnowledgeLayer` composition. The lines and their start times live in
`src/narration.ts`; `pnpm narrate` voices them with ElevenLabs into `public/narration/`.

| Time | Picture | Narration |
| --- | --- | --- |
| 0–3s | Opening | AI changes who reads your design system. |
| 3–10s | Scattered sources | Visuals, behavior, and decisions live in different places. People connect the dots. Agents guess. |
| 10–15s | Plausible mistake | And a plausible guess can still be wrong. |
| 15–23s | Rules with an address | A spec writes the rules down once. Each rule has an ID and a level, so every answer can be cited. |
| 23–30s | Shared reference | Design tools, component libraries, documentation, and agents all read the same spec. |
| 30–41s | Agent ready | Now the agent asks first. It chooses danger emphasis, names the result, and separates the action, and it cites the rule behind each choice. |
| 41–45s | Closing | Give agents the rules behind the components. |

Use a calm explanatory delivery. Emphasize “guess”, “cited”, and “asks first”.
After editing a line, run `pnpm narrate <id>` to regenerate it. The script warns when a line runs
into the next one; move its `start` or lengthen the chapter in `src/scenes/Shift.tsx`.
