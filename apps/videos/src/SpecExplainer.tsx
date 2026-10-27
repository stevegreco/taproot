import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { dip } from "./components/dip";
import { AgentReady } from "./scenes/AgentReady";
import { Audit } from "./scenes/Audit";
import { Checks } from "./scenes/Checks";
import { Close } from "./scenes/Close";
import { Contract } from "./scenes/Contract";
import { Hook } from "./scenes/Hook";
import { Links } from "./scenes/Links";
import { Mistake } from "./scenes/Mistake";
import { Reach } from "./scenes/Reach";
import { Rules } from "./scenes/Rules";
import { Scattered } from "./scenes/Scattered";
import { Structured } from "./scenes/Structured";
import { color } from "./theme";
import { AUDIO_SEGMENTS, SCENES, TRANSITION } from "./timeline";

export { TOTAL_DURATION } from "./timeline";

// The architecture shift, in under a minute and a half: many sources of truth, an agent that
// guesses, the rules written down once as a spec stored as structured data, the same request answered by an agent that cites
// each rule, the same rules reviewing an existing screen, and every other output reading from that spec.
// One scene per narration section. Durations come from the voiceover in timeline.ts, so they stay
// in sync when the take is regenerated; each scene is also registered on its own in Root.tsx.
export function SpecExplainer() {
  const { fps } = useVideoConfig();
  const change = () => (
    <TransitionSeries.Transition
      presentation={dip()}
      timing={linearTiming({ durationInFrames: TRANSITION })}
    />
  );
  return (
    <AbsoluteFill style={{ backgroundColor: color.paper }}>
      <TransitionSeries>
        <TransitionSeries.Sequence
          name="Hook"
          durationInFrames={SCENES.hook.duration}
          premountFor={fps}
        >
          <Hook />
        </TransitionSeries.Sequence>
        {change()}
        <TransitionSeries.Sequence
          name="Scattered"
          durationInFrames={SCENES.scattered.duration}
          premountFor={fps}
        >
          <Scattered />
        </TransitionSeries.Sequence>
        {change()}
        <TransitionSeries.Sequence
          name="Mistake"
          durationInFrames={SCENES.mistake.duration}
          premountFor={fps}
        >
          <Mistake />
        </TransitionSeries.Sequence>
        {change()}
        <TransitionSeries.Sequence
          name="Contract"
          durationInFrames={SCENES.contract.duration}
          premountFor={fps}
        >
          <Contract />
        </TransitionSeries.Sequence>
        {change()}
        <TransitionSeries.Sequence
          name="Structured"
          durationInFrames={SCENES.structured.duration}
          premountFor={fps}
        >
          <Structured />
        </TransitionSeries.Sequence>
        {change()}
        <TransitionSeries.Sequence
          name="Links"
          durationInFrames={SCENES.links.duration}
          premountFor={fps}
        >
          <Links />
        </TransitionSeries.Sequence>
        {change()}
        <TransitionSeries.Sequence
          name="Rules"
          durationInFrames={SCENES.rules.duration}
          premountFor={fps}
        >
          <Rules />
        </TransitionSeries.Sequence>
        {change()}
        <TransitionSeries.Sequence
          name="Checks"
          durationInFrames={SCENES.checks.duration}
          premountFor={fps}
        >
          <Checks />
        </TransitionSeries.Sequence>
        {change()}
        <TransitionSeries.Sequence
          name="AgentReady"
          durationInFrames={SCENES.agent.duration}
          premountFor={fps}
        >
          <AgentReady />
        </TransitionSeries.Sequence>
        {change()}
        <TransitionSeries.Sequence
          name="Audit"
          durationInFrames={SCENES.audit.duration}
          premountFor={fps}
        >
          <Audit />
        </TransitionSeries.Sequence>
        {change()}
        <TransitionSeries.Sequence
          name="Reach"
          durationInFrames={SCENES.reach.duration}
          premountFor={fps}
        >
          <Reach />
        </TransitionSeries.Sequence>
        {change()}
        <TransitionSeries.Sequence
          name="Close"
          durationInFrames={SCENES.close.duration}
          premountFor={fps}
        >
          <Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {AUDIO_SEGMENTS.map(({ id, at, trimBefore, durationInFrames }) => (
        <Audio
          key={id}
          name={`Narration ${id}`}
          src={staticFile("narration/continuous.mp3")}
          from={at}
          trimBefore={trimBefore}
          durationInFrames={durationInFrames}
          premountFor={fps}
        />
      ))}
    </AbsoluteFill>
  );
}
