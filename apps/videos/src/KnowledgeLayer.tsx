import { AbsoluteFill, Sequence } from "remotion";
import { AgentReady } from "./scenes/AgentReady";
import { Architecture } from "./scenes/Architecture";
import { Intro } from "./scenes/Intro";
import { Library } from "./scenes/Library";
import { Outro } from "./scenes/Outro";
import { Problem } from "./scenes/Problem";
import { color, sec } from "./theme";
import { useTheme } from "./useTheme";

// Scene order and length, under a minute. Each scene fades itself in and out. The story: our
// context drifts across copies, so write it down once, let every tool read it, and agents build
// from it correctly.
const scenes = [
  { name: "Intro", Component: Intro, duration: sec(3.5) },
  { name: "Problem", Component: Problem, duration: sec(8) },
  { name: "Library", Component: Library, duration: sec(8) },
  { name: "Architecture", Component: Architecture, duration: sec(11) },
  { name: "AgentReady", Component: AgentReady, duration: sec(18) },
  { name: "Outro", Component: Outro, duration: sec(7.5) },
];

export const TOTAL_DURATION = scenes.reduce((sum, s) => sum + s.duration, 0);

export function KnowledgeLayer() {
  // The Agent ready scene renders a real <ds-button>, which reads the light theme's tokens.
  useTheme("light");
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
