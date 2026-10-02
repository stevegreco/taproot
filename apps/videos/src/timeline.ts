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
    trimAfter: sec(to - AUDIO_START),
  };
});

// Bring each picture in just before its sentence.
const pictureStart = (id: Section) => sec(toVideo(timing.sections[id].start)) - 5;
export const SHIFT_START = pictureStart("02-scattered");
export const AGENT_START = pictureStart("08-agent");
export const REACH_START = pictureStart("09-shared");
export const CLOSE_START = pictureStart("10-close");
export const TOTAL_DURATION = sec(toVideo(timing.audioEnd) + 0.8);
export const PHASE = {
  agent: pictureStart("03-mistake") - SHIFT_START,
  spec: pictureStart("04-spec") - SHIFT_START,
  links: pictureStart("05-links") - SHIFT_START,
  rules: pictureStart("06-rules") - SHIFT_START,
  validate: pictureStart("07-validate") - SHIFT_START,
  end: AGENT_START - SHIFT_START,
};

/** Frame of each spoken cue, relative to the start of the scene it plays in. */
const cuesFrom = (start: number) =>
  Object.fromEntries(
    Object.entries(timing.events).map(([name, time]) => [name, sec(toVideo(time)) - start]),
  ) as Record<Cue, number>;
export const SHIFT_CUES = cuesFrom(SHIFT_START);
export const AGENT_CUES = cuesFrom(AGENT_START);
export const REACH_CUES = cuesFrom(REACH_START);
