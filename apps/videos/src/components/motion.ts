import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 → 1 spring that starts at `delay` frames. */
export function useEnter(delay = 0, damping = 26) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.8 } });
}

/** Eased 0 → 1 over `length` frames from `start`. */
export function ease(frame: number, start: number, length = 20) {
  return interpolate(frame, [start, start + length], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
}

export function rise(p: number, distance = 18) {
  return { opacity: p, translate: `0 ${(1 - p) * distance}px` };
}

export function pop(p: number) {
  return { opacity: p, scale: `${0.98 + 0.02 * p}` };
}
