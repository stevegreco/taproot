# Design system spec narration

Archer performs the complete script in one Eleven v4 request, so the delivery carries across scenes.
Playback splits the take only between sections, halfway through each natural pause, and adds that
section's `hold` of silence so the picture has time to land. The take is never cut mid-sentence.

Eleven v4 has no SSML breaks. Tone comes from audio tags (`[warm]`, `[thoughtful]`, `[curious]`,
`[confident]`, and an inline `[sighs]`), and pacing from ellipses and short sentences: "The parts.
The options. The states." Tags in the script are directions, not speech; cue matching skips them.

| Section | Take time | Hold | Script |
| --- | --- | --- | --- |
| 01-opening | 0.45s | 0.4s | [warm] AI is changing who reads your design system. |
| 02-scattered | 3.61s | 0.6s | The visuals are in Figma... the behavior's in code... and the reasons behind it? Those are in someone's head. |
| 03-mistake | 9.93s | 1.0s | [thoughtful] People fill in those gaps without thinking. An agent can't. It builds something that looks right... [sighs] but misses the point. |
| 04-spec | 17.85s | 0.6s | [confident] That's where a component spec comes in. It's a contract, written once, with no code in it. The parts. The options. The states. The tokens. And the rules. |
| 05-links | 27.89s | 0.6s | And it doesn't stand alone. Each component links to the patterns, guidelines, and examples around it... so the reasons travel with the rules. |
| 06-rules | 36.09s | 0.5s | Every rule gets an address, and a level, like must or should. So an agent can look it up... and cite it. |
| 07-validate | 42.53s | 0.6s | It's all checked, too. Every link, every reference... so the spec stays true as it grows. |
| 08-agent | 48.41s | 1.2s | [curious] So what happens when you ask an agent to add a delete action? It searches the spec, and reads Button and the action hierarchy pattern. Then it decides. Danger, because it's destructive. A label that names the result. A place apart from routine actions. [confident] Every choice cites a rule. |
| 09-shared | 66.33s | 0.6s | [warm] Design tools and component libraries build from the same spec. Docs and agents read it, through a CLI and MCP. |
| 10-close | 73.69s | 0s | So... give agents the rules behind the components. |

## Regeneration

Edit `src/narration.ts`, then run `pnpm --dir apps/videos narrate`. The generator detects changes
to the script, voice, model, or seed. Use `--force` to regenerate an unchanged request.
Per-line regeneration is no longer supported because delivery depends on the complete take.

`public/narration/continuous.mp3` is the audio. `alignment.json` stores the character timestamps;
`timing.json` stores the chapter and phrase cues, in take time. `src/timeline.ts` adds the holds,
maps every cue to video time, slices the audio, and derives all scene boundaries. Changing a
`hold` needs no new take. The scattered sources, spec sections, linked records,
checks, the agent's calls and decisions, and the rules reaching each output follow their phrases.
`node --test apps/videos/scripts/narration-timing.test.mjs` validates cue extraction.

Render with `pnpm --dir apps/videos render SpecExplainer out/spec-explainer.mp4`.

Delivery guidance: https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices#prompting-eleven-v4
