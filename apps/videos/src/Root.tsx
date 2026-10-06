import "@stevegreco/design-system/css";
import "@stevegreco/design-system-components";
import { Composition, Folder } from "remotion";
import { ComponentShowcase } from "./ComponentShowcase";
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
import { SpecExplainer, TOTAL_DURATION } from "./SpecExplainer";
import { FPS } from "./theme";
import { SCENES } from "./timeline";

export const RemotionRoot = () => (
  <>
    <Composition
      id="SpecExplainer"
      component={SpecExplainer}
      durationInFrames={TOTAL_DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
    {/* Each SpecExplainer scene on its own, at the length it plays in the full video. */}
    <Folder name="SpecExplainer-Scenes">
      <Composition
        id="Hook"
        component={Hook}
        durationInFrames={SCENES.hook.duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scattered"
        component={Scattered}
        durationInFrames={SCENES.scattered.duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Mistake"
        component={Mistake}
        durationInFrames={SCENES.mistake.duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Contract"
        component={Contract}
        durationInFrames={SCENES.contract.duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Links"
        component={Links}
        durationInFrames={SCENES.links.duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Rules"
        component={Rules}
        durationInFrames={SCENES.rules.duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Checks"
        component={Checks}
        durationInFrames={SCENES.checks.duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="AgentReady"
        component={AgentReady}
        durationInFrames={SCENES.agent.duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Audit"
        component={Audit}
        durationInFrames={SCENES.audit.duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Reach"
        component={Reach}
        durationInFrames={SCENES.reach.duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Close"
        component={Close}
        durationInFrames={SCENES.close.duration}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </Folder>
    <Composition
      id="ComponentShowcase"
      component={ComponentShowcase}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ theme: "light" as const }}
    />
    <Composition
      id="ComponentShowcaseDark"
      component={ComponentShowcase}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ theme: "dark" as const }}
    />
  </>
);
