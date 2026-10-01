import "@stevegreco/design-system/css";
import "@stevegreco/design-system-components";
import { Composition } from "remotion";
import { ComponentShowcase } from "./ComponentShowcase";
import { KnowledgeLayer, TOTAL_DURATION } from "./KnowledgeLayer";
import { FPS } from "./theme";

export const RemotionRoot = () => (
  <>
    <Composition
      id="KnowledgeLayer"
      component={KnowledgeLayer}
      durationInFrames={TOTAL_DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
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
