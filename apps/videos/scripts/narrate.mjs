// Generate one continuous narration performance and derive picture cues from its character alignment.
// `pnpm narrate` reuses an unchanged take. `pnpm narrate --force` records a new take.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  AUDIO_START,
  MODEL_ID,
  NARRATION_SEED,
  VOICE_ID,
  narration,
  narrationCues,
} from "../src/narration.ts";
import { buildTiming } from "./narration-timing.mjs";

const outDir = fileURLToPath(new URL("../public/narration/", import.meta.url));
const audioFile = `${outDir}continuous.mp3`;
const timingFile = `${outDir}timing.json`;
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--force")) {
  throw new Error(
    "Narration is now one continuous take. Use pnpm narrate or pnpm narrate --force.",
  );
}
const text = narration
  .map((line) => `${line.delivery ? `[${line.delivery}] ` : ""}${line.text}`)
  .join(" ");
const body = {
  model_id: MODEL_ID,
  inputs: [{ text, voice_id: VOICE_ID }],
  seed: NARRATION_SEED,
  language_code: "en",
};
if (text.length > 2000)
  throw new Error("Keep the complete dialogue request under 2,000 characters.");
const fingerprint = createHash("sha256")
  .update(JSON.stringify({ body, AUDIO_START }))
  .digest("hex");
const previous = existsSync(timingFile) ? JSON.parse(await readFile(timingFile, "utf8")) : null;
if (!args.includes("--force") && existsSync(audioFile) && previous?.fingerprint === fingerprint) {
  const alignment = JSON.parse(await readFile(`${outDir}alignment.json`, "utf8"));
  const timing = buildTiming(alignment, narration, AUDIO_START, narrationCues);
  await writeFile(timingFile, `${JSON.stringify({ ...previous, ...timing }, null, 2)}\n`);
  console.log(
    "The continuous narration is current; timing cues refreshed. Use --force for another take.",
  );
  process.exit(0);
}
const key = process.env.ELEVENLABS_KEY;
if (!key) throw new Error("ELEVENLABS_KEY is not set. Add it to apps/videos/.env.");
const res = await fetch(
  "https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps?output_format=mp3_44100_128",
  {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  },
);
if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
const { audio_base64, alignment, normalized_alignment } = await res.json();
if (!audio_base64) throw new Error("ElevenLabs returned no audio.");
const timing = buildTiming(
  alignment ?? normalized_alignment,
  narration,
  AUDIO_START,
  narrationCues,
);
const metadata = { ...timing, fingerprint, model: MODEL_ID, voice: VOICE_ID, seed: NARRATION_SEED };
await mkdir(outDir, { recursive: true });
// Validate every cue before replacing the previous take.
await writeFile(`${audioFile}.tmp`, Buffer.from(audio_base64, "base64"));
await writeFile(`${timingFile}.tmp`, `${JSON.stringify(metadata, null, 2)}\n`);
await writeFile(
  `${outDir}alignment.json`,
  `${JSON.stringify(alignment ?? normalized_alignment, null, 2)}\n`,
);
await rename(`${audioFile}.tmp`, audioFile);
await rename(`${timingFile}.tmp`, timingFile);
console.log(`Continuous take: ${timing.audioEnd.toFixed(2)}s`);
for (const [id, cue] of Object.entries(timing.sections))
  console.log(`${id}: ${cue.start.toFixed(2)}–${cue.end.toFixed(2)}s`);
