// Match spoken text to character timestamps even when the API normalizes punctuation or tags.
export function buildTiming(alignment, narration, offset, cues = {}) {
  if (!alignment?.characters?.length) throw new Error("Missing character alignment.");
  const {
    characters,
    character_start_times_seconds: starts,
    character_end_times_seconds: ends,
  } = alignment;
  if (characters.length !== starts?.length || characters.length !== ends?.length) {
    throw new Error("Inconsistent character alignment lengths.");
  }
  if (
    starts.some(
      (t, i) =>
        !Number.isFinite(t) ||
        t < 0 ||
        !Number.isFinite(ends[i]) ||
        ends[i] < t ||
        (i > 0 && t < starts[i - 1]),
    )
  ) {
    throw new Error("Invalid or non-monotonic character timestamps.");
  }
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  // Audio tags such as [sighs] are directions, not speech. Skip them on both sides of the match,
  // whether or not the API includes them in its alignment.
  const spoken = (s) => normalize(s.replace(/\[[^\]]*\]/g, ""));
  const indices = [];
  let normalized = "";
  let inTag = false;
  characters.forEach((char, i) => {
    if (char === "[") inTag = true;
    const token = inTag ? "" : normalize(char);
    if (char === "]") inTag = false;
    normalized += token;
    for (let j = 0; j < token.length; j++) indices.push(i);
  });
  const sections = {};
  let cursor = 0;
  for (const line of narration) {
    const needle = spoken(line.text);
    const index = normalized.indexOf(needle, cursor);
    if (!needle || index < 0) throw new Error(`Cannot align narration section ${line.id}.`);
    const start = starts[indices[index]] + offset;
    const end = ends[indices[index + needle.length - 1]] + offset;
    if (end <= start) throw new Error(`Empty narration section ${line.id}.`);
    sections[line.id] = { start, end };
    cursor = index + needle.length;
  }
  const events = {};
  for (const [name, phrase] of Object.entries(cues)) {
    const index = normalized.indexOf(spoken(phrase));
    if (index < 0) throw new Error(`Cannot align cue ${name}.`);
    events[name] = starts[indices[index]] + offset;
  }
  return { events, audioStart: offset, audioEnd: ends.at(-1) + offset, sections };
}
