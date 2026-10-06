import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { clamp } from "./motion";

type DipProps = Record<string, never>;

/**
 * Fade the old scene out to the paper background, then the new scene in. Unlike a crossfade, two
 * headlines never overlap on the shared grid.
 */
function Dip({
  children,
  presentationDirection,
  presentationProgress,
}: TransitionPresentationComponentProps<DipProps>) {
  const opacity =
    presentationDirection === "exiting"
      ? interpolate(presentationProgress, [0, 0.5], [1, 0], clamp)
      : interpolate(presentationProgress, [0.5, 1], [0, 1], clamp);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

export const dip = (): TransitionPresentation<DipProps> => ({ component: Dip, props: {} });
