import "@stevegreco/design-system/css";
import "@stevegreco/design-system-components";
import { Composition } from "remotion";
import { ComponentShowcase } from "./ComponentShowcase";

export const RemotionRoot = () => (
  <>
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
