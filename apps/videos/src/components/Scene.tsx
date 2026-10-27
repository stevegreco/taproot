import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { color, fonts } from "../theme";

/**
 * Full-frame scene on the shared grid. Fades between scenes come from the `TransitionSeries` in
 * SpecExplainer, so a scene opened on its own in Studio starts and ends on its full picture.
 */
export function Scene({ children }: { children: ReactNode }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: color.paper,
        color: color.ink,
        fontFamily: fonts.sans,
        padding: "90px 120px",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
