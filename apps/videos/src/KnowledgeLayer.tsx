import { AbsoluteFill, Sequence } from "remotion";
import { AgentReady } from "./scenes/AgentReady";
import { Close } from "./scenes/Close";
import { Hook } from "./scenes/Hook";
import { SHIFT_DURATION, Shift } from "./scenes/Shift";
import { color, sec } from "./theme";

// The architecture shift, in under a minute: many sources of truth, an agent that guesses, the
// knowledge moving to one center, every output reading from it, and an agent that gets it right.
// Each scene fades itself in and out; Shift is one continuous scene so its boxes rearrange.
const scenes = [
  { name: "Hook", Component: Hook, duration: sec(4) },
  { name: "Shift", Component: Shift, duration: SHIFT_DURATION },
  { name: "AgentReady", Component: AgentReady, duration: sec(10) },
  { name: "Close", Component: Close, duration: sec(4.5) },
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
    </AbsoluteFill>
  );
}
