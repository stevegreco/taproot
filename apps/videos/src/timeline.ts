import timing from "../public/narration/timing.json";
import { AUDIO_START, narration } from "./narration";
import { sec } from "./theme";

type Section = keyof typeof timing.sections;
type Cue = keyof typeof timing.events;

// The take is one continuous performance. Playback splits it between sections, halfway through
// each natural pause, and inserts each section's `hold` of silence so the picture can land.
const ids = narration.map((line) => line.id) as Section[];
const cuts = ids.slice(0, -1).map((id, i) => {
  const next = ids[i + 1];
  return (timing.sections[id].end + timing.sections[next].start) / 2;
});
const delays = narration.map((_, i) =>
  narration.slice(0, i).reduce((sum, line) => sum + line.hold, 0),
);

/** Map a time in the take (seconds) to a time in the video (seconds). */
const toVideo = (t: number) => t + delays[cuts.filter((cut) => cut <= t).length];

/** Each slice of the take, as frames: where it plays, and what part of the file it plays. */
export const AUDIO_SEGMENTS = ids.map((id, i) => {
  const from = i === 0 ? AUDIO_START : cuts[i - 1];
  const to = i === ids.length - 1 ? timing.audioEnd + 0.3 : cuts[i];
  return {
    id,
    at: sec(from + delays[i]),
    trimBefore: sec(from - AUDIO_START),
    durationInFrames: sec(to - AUDIO_START) - sec(from - AUDIO_START),
  };
});

/** Frames two neighboring scenes overlap: the old one fades out, then the new one fades in. */
export const TRANSITION = 16;
/** Silence after the last word, so the closing line can sit on screen. */
const TAIL = 0.8;
export const TOTAL_DURATION = sec(toVideo(timing.audioEnd) + TAIL);

/**
 * One scene per narration section. Each picture arrives just before its sentence; the first starts
 * the video. A scene's duration includes the transition into the next one, so with the overlap of
 * a `TransitionSeries`, every scene's frame 0 still lands on its `from`.
 */
const starts = ids.map((id, i) => (i === 0 ? 0 : sec(toVideo(timing.sections[id].start)) - 5));

function scene(id: Section) {
  const i = ids.indexOf(id);
  const from = starts[i];
  const end = i === ids.length - 1 ? TOTAL_DURATION : starts[i + 1] + TRANSITION;
  // Frame of each spoken cue, relative to the start of this scene.
  const cues = Object.fromEntries(
    Object.entries(timing.events).map(([name, time]) => [name, sec(toVideo(time)) - from]),
  ) as Record<Cue, number>;
  return { from, duration: end - from, cues };
}

export const SCENES = {
  hook: scene("01-opening"),
  scattered: scene("02-scattered"),
  mistake: scene("03-mistake"),
  contract: scene("04-spec"),
  links: scene("05-links"),
  rules: scene("06-rules"),
  checks: scene("07-validate"),
  agent: scene("08-agent"),
  reach: scene("09-shared"),
  close: scene("10-close"),
};
