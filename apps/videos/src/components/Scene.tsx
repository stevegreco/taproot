import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { color, fonts } from "../theme";

const FADE = 12;

/** Full-frame scene that fades in and out over its own duration. */
export function Scene({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, FADE, durationInFrames - FADE, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill
      style={{
        opacity,
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
