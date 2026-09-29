import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { type Theme, useTheme } from "./useTheme";

const token = (name: string) => `var(--${name})`;

const FadeUp = ({ children, style }: { children: React.ReactNode; style?: CSSProperties }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 200 } });

  return (
    <div
      style={{
        ...style,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

export const ComponentShowcase = ({ theme }: { theme: Theme }) => {
  useTheme(theme);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    easing: Easing.out(Easing.ease),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: token("semantic-color-background-default"),
        color: token("semantic-color-foreground-default"),
        fontFamily: token("semantic-typography-body-default-font-family"),
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        opacity: fadeOut,
        // The composition is 1920px wide; scale token-sized UI up to read on video.
        zoom: 2,
      }}
    >
      <Sequence from={0} layout="none">
        <FadeUp>
          <h1
            style={{
              margin: 0,
              fontFamily: token("semantic-typography-heading-large-font-family"),
              fontSize: token("semantic-typography-heading-large-font-size"),
              fontWeight: token("semantic-typography-heading-large-font-weight"),
            }}
          >
            Ember &amp; Sage
          </h1>
        </FadeUp>
      </Sequence>
      <Sequence from={20} layout="none">
        <FadeUp style={{ display: "flex", gap: 16 }}>
          <ds-button variant="primary">Save changes</ds-button>
          <ds-button variant="secondary">Cancel</ds-button>
        </FadeUp>
      </Sequence>
      <Sequence from={40} layout="none">
        <FadeUp style={{ display: "flex", gap: 12 }}>
          <ds-badge variant="success">Shipped</ds-badge>
          <ds-badge variant="info">Beta</ds-badge>
          <ds-badge variant="warning">Deprecated</ds-badge>
        </FadeUp>
      </Sequence>
    </AbsoluteFill>
  );
};
