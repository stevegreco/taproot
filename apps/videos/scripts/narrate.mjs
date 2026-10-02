// Generates the voiceover with ElevenLabs: one MP3 per line in `src/narration.ts`, written to
// `public/narration/`, plus `durations.json`. Lines whose MP3 already exists are skipped; pass
// `--force` to regenerate them all, or line ids to regenerate only those.
//
//   pnpm narrate              # missing lines only
//   pnpm narrate --force      # every line
//   pnpm narrate 04-rules     # one line
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { MODEL_ID, VOICE_ID, narration } from "../src/narration.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = `${root}public/narration/`;
const key = process.env.ELEVENLABS_KEY;
if (!key) {
  console.error("ELEVENLABS_KEY is not set. Add it to apps/videos/.env.");
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));

await mkdir(outDir, { recursive: true });
const durationsFile = `${outDir}durations.json`;
const durations = existsSync(durationsFile)
  ? JSON.parse(await readFile(durationsFile, "utf8"))
  : {};

for (const [i, line] of narration.entries()) {
  const file = `${outDir}${line.id}.mp3`;
  const wanted = only.length ? only.includes(line.id) : force || !existsSync(file);
  if (wanted) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": key, "content-type": "application/json" },
        body: JSON.stringify({
          text: line.text,
          model_id: MODEL_ID,
          voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.1 },
          // Neighbouring lines keep the intonation continuous across separate clips.
          previous_text: narration[i - 1]?.text,
          next_text: narration[i + 1]?.text,
        }),
      },
    );
    if (!res.ok) {
      console.error(`${line.id}: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
    const { audio_base64, alignment } = await res.json();
    await writeFile(file, Buffer.from(audio_base64, "base64"));
    durations[line.id] = alignment.character_end_times_seconds.at(-1);
    console.log(`${line.id}: ${durations[line.id].toFixed(2)}s`);
  }
}
await writeFile(durationsFile, `${JSON.stringify(durations, null, 2)}\n`);

// Warn when a line runs into the next one.
for (const [i, line] of narration.entries()) {
  const next = narration[i + 1];
  const end = line.start + (durations[line.id] ?? 0);
  if (next && end > next.start - 0.2) {
    console.warn(`! ${line.id} ends at ${end.toFixed(2)}s, too close to ${next.id} at ${next.start}s`);
  }
}
