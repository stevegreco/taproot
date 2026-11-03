/**
 * Verify: run the steps in `progress-bar.verify.js`. The docs tests run them against the built site.
 */
import { useEffect, useState } from "react";
import "@stevegreco/web-components";

const FILES = ["beach.jpg", "harbor.jpg", "market.jpg", "sunset.jpg"];
// Stands in for the time each file takes to upload.
const FILE_MS = 600;

type Phase = "idle" | "uploading" | "done";

export default function ProgressBarExample() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploaded, setUploaded] = useState(0);

  useEffect(() => {
    if (phase !== "uploading") return;
    if (uploaded === FILES.length) {
      setPhase("done");
      return;
    }
    const next = setTimeout(() => setUploaded((count) => count + 1), FILE_MS);
    return () => clearTimeout(next);
  }, [phase, uploaded]);

  function start() {
    setUploaded(0);
    setPhase("uploading");
  }

  return (
    <div className="flex max-w-xl flex-col gap-4 p-6 text-slate-900 dark:text-white">
      <p className="m-0">{FILES.length} photos selected for the trip album.</p>

      <ds-button
        variant="primary"
        disabled={phase === "uploading" || undefined}
        onClick={start}
        data-progress-bar-start
      >
        {phase === "done" ? "Upload again" : "Upload photos"}
      </ds-button>

      {phase === "uploading" && (
        <ds-progress-bar
          label={`Uploading ${FILES.length} photos`}
          value={uploaded}
          max={FILES.length}
          data-progress-bar-subject
        />
      )}

      {phase === "done" && (
        <ds-alert variant="success" announce="polite" data-progress-bar-outcome>
          Uploaded {FILES.length} photos to the trip album.
        </ds-alert>
      )}
    </div>
  );
}
