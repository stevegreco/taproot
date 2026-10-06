import { AbsoluteFill, Html5Audio, Sequence, staticFile } from "remotion";
import {
  AGENT_START,
  AUDIO_SEGMENTS,
  CLOSE_START,
  REACH_START,
  SHIFT_START,
  TOTAL_DURATION,
} from "./timeline";
import { AgentReady } from "./scenes/AgentReady";
import { Close } from "./scenes/Close";
import { Hook } from "./scenes/Hook";
import { Reach } from "./scenes/Reach";
import { Shift } from "./scenes/Shift";
import { color } from "./theme";

// The architecture shift, in under a minute: many sources of truth, an agent that guesses, the
// rules written down once as a spec, the same request answered by an agent that cites each rule,
// and every other output reading from that spec.
// Chapters share a fixed grid and use restrained fades to keep attention on the explanation.
const scenes = [
  { name: "Hook", Component: Hook, duration: SHIFT_START },
  { name: "Shift", Component: Shift, duration: AGENT_START - SHIFT_START },
  { name: "AgentReady", Component: AgentReady, duration: REACH_START - AGENT_START },
  { name: "Reach", Component: Reach, duration: CLOSE_START - REACH_START },
  { name: "Close", Component: Close, duration: TOTAL_DURATION - CLOSE_START },
];

export { TOTAL_DURATION } from "./timeline";

export function SpecExplainer() {
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
      {AUDIO_SEGMENTS.map(({ id, at, trimBefore, trimAfter }) => (
        <Sequence key={id} name={`Narration ${id}`} from={at} layout="none">
          <Html5Audio
            src={staticFile("narration/continuous.mp3")}
            trimBefore={trimBefore}
            trimAfter={trimAfter}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
