import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import { narration } from "./narration";
import { AgentReady } from "./scenes/AgentReady";
import { Close } from "./scenes/Close";
import { Hook } from "./scenes/Hook";
import { SHIFT_DURATION, Shift } from "./scenes/Shift";
import { color, sec } from "./theme";

// The architecture shift, in under a minute: many sources of truth, an agent that guesses, the
// rules written down once as a spec, every output reading from it, and an agent that asks first and
// cites the rule behind each choice.
// Chapters share a fixed grid and use restrained fades to keep attention on the explanation.
const scenes = [
  { name: "Hook", Component: Hook, duration: sec(3) },
  { name: "Shift", Component: Shift, duration: SHIFT_DURATION },
  { name: "AgentReady", Component: AgentReady, duration: sec(11) },
  { name: "Close", Component: Close, duration: sec(4) },
];

export const TOTAL_DURATION = scenes.reduce((sum, s) => sum + s.duration, 0);

export function KnowledgeLayer() {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: color.paper }}>
      {scenes.map(({ name, Component, duration }) => {
        const start = from;
        from += duration;
        return (
          <Sequence key={name} name={name} from={start} durationInFrames={duration}>
            <Component />
          </Sequence>
        );
      })}
      {narration.map(({ id, start }) => (
        <Sequence key={id} name={`Voice ${id}`} from={sec(start)} layout="none">
          <Html5Audio src={staticFile(`narration/${id}.mp3`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
