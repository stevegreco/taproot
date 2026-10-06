# Design system spec narration

Jessica performs the complete script in one Eleven v4 request, so the delivery carries across scenes.
Playback splits the take only between sections, halfway through each natural pause, and adds that
section's `hold` of silence so the picture has time to land. The take is never cut mid-sentence.

Eleven v4 has no SSML breaks. One `[warm]` tag on the opening line sets the tone for the whole take;
the other sections carry no tags, so the voice keeps one consistent mood instead of switching
between scenes. Pacing comes from ellipses and short sentences. The script is written for viewers
new to design systems: plain words, no internal names, and spoken to the viewer. Tags are
directions, not speech; cue matching skips them.

| Section | Take time | Hold | Script |
| --- | --- | --- | --- |
| 01-opening | 0.33s | 0.4s | [warm] Your design system has a new kind of reader... and it isn't a person. |
| 02-scattered | 5.37s | 0.6s | Today, how a button looks lives in Figma. How it works lives in code. And why it works that way? That's usually in someone's head. |
| 03-mistake | 14.41s | 1s | A new teammate would just ask around. An AI assistant can't. So it guesses... and you get something that looks right, but isn't. |
| 04-spec | 23.93s | 0.6s | A spec fixes that. Think of it as the instructions that come with every component, written in plain language instead of code. It spells out what a component is made of, what it can do, every state it can be in, the exact colors and sizes it uses... and the rules for using it well. |
| 05-links | 41.53s | 0.6s | Each component also points to the bigger picture: the patterns it follows, the guidelines behind it, and real examples. So the why never gets lost. |
| 06-rules | 51.61s | 0.5s | Every rule is labeled, too. Must, or should. So an assistant can find the exact rule... and tell you which one it followed. |
| 07-validate | 59.89s | 0.6s | And it's all checked automatically, so nothing goes stale as the system grows. |
| 08-agent | 64.85s | 1.2s | So let's watch it work. You ask an assistant to add a delete button. Instead of guessing, it looks things up first, and reads the rules for buttons. It marks the button as dangerous, because deleting can't be undone. It says Delete project, not just Remove. And it keeps it apart from the everyday buttons. Every choice is backed by a rule you can check. |
| 09-audit | 87.45s | 0.8s | It works on what you already have, too. Point an assistant at an existing screen, and it checks it against the same rules. It flags what breaks a must, notes what misses a should... and tells you exactly which rule, so a review isn't a matter of opinion. |
| 10-shared | 102.81s | 0.6s | Design tools, component libraries, docs, and AI assistants all work from the same source... so everyone builds the same thing. |
| 11-close | 111.53s | 0s | Write the reasons down once. Then everyone, and everything, can follow them. |

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
