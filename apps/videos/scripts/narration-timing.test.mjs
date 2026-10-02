import assert from "node:assert/strict";
import test from "node:test";
import { buildTiming } from "./narration-timing.mjs";

const aligned = (text) => ({
  characters: [...text],
  character_start_times_seconds: [...text].map((_, i) => i / 10),
  character_end_times_seconds: [...text].map((_, i) => (i + 1) / 10),
});

test("maps spoken sections and phrase cues through tags and punctuation", () => {
  const text = "[warm] Hello, world! Then choose danger.";
  const timing = buildTiming(
    aligned(text),
    [
      { id: "intro", text: "Hello world." },
      { id: "result", text: "Then choose danger." },
    ],
    0.25,
    { emphasis: "choose danger" },
  );
  assert.equal(timing.sections.intro.start, text.indexOf("Hello") / 10 + 0.25);
  assert.equal(timing.events.emphasis, text.indexOf("choose") / 10 + 0.25);
  assert.equal(timing.sections.result.end, text.indexOf("danger") / 10 + 0.6 + 0.25);
});

test("repeated sections match forward rather than reusing an earlier sentence", () => {
  const timing = buildTiming(
    aligned("One. One."),
    [
      { id: "a", text: "One." },
      { id: "b", text: "One." },
    ],
    0,
  );
  assert.equal(timing.sections.a.start, 0);
  assert.equal(timing.sections.b.start, 0.5);
});

test("rejects missing text instead of silently desynchronizing the video", () => {
  assert.throws(
    () => buildTiming(aligned("Hello"), [{ id: "missing", text: "Goodbye" }], 0),
    /Cannot align/,
  );
  assert.throws(() => buildTiming(aligned("Hello"), [], 0, { bad: "Goodbye" }), /Cannot align cue/);
});

test("rejects malformed or reversed timestamps", () => {
  assert.throws(() => buildTiming(null, [], 0), /Missing/);
  const data = aligned("Hello");
  data.character_start_times_seconds[2] = -1;
  assert.throws(() => buildTiming(data, [], 0), /Invalid/);
});

test("inline audio tags are skipped in the script and in the alignment", () => {
  const text = "So... [sighs] it misses the point.";
  const timing = buildTiming(
    aligned(text),
    [{ id: "a", text: "So... [sighs] it misses the point." }],
    0,
    { miss: "misses" },
  );
  assert.equal(timing.sections.a.start, 0);
  assert.equal(timing.events.miss, text.indexOf("misses") / 10);
  const untagged = "So... it misses the point.";
  const timing2 = buildTiming(aligned(untagged), [{ id: "a", text }], 0);
  assert.equal(timing2.sections.a.end, (untagged.indexOf("point") + 5) / 10);
});
