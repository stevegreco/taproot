import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 → 1 spring that starts at `delay` frames. */
export function useEnter(delay = 0, damping = 26) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.8 } });
}

/** Linear 0 → 1 between two frames. */
export function useProgress(from: number, to: number) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], clamp);
}

export function rise(p: number, distance = 18) {
  return { opacity: p, transform: `translateY(${(1 - p) * distance}px)` };
}

export function pop(p: number) {
  return { opacity: p, transform: `scale(${0.98 + 0.02 * p})` };
}
