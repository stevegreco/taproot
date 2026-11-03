/**
 * Verify: run the steps in `spinner.verify.js`. The docs tests run them against the built site.
 */
import { useEffect, useState } from "react";
import "@stevegreco/web-components";

// The spinner waits this long before it shows, so quick responses show nothing.
const SHOW_AFTER_MS = 1000;
// Stands in for a request that takes longer than that.
const REQUEST_MS = 2500;

const COMMENTS = [
  "Can we move the launch to Thursday?",
  "Thursday works for design.",
  "Engineering is fine with Thursday too.",
];

type Phase = "idle" | "loading" | "loaded";

export default function SpinnerExample() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (phase !== "loading") return;
    const show = setTimeout(() => setShowSpinner(true), SHOW_AFTER_MS);
    const done = setTimeout(() => {
      setShowSpinner(false);
      setPhase("loaded");
    }, REQUEST_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(done);
    };
  }, [phase]);

  return (
    <div className="flex max-w-xl flex-col gap-4 p-6 text-slate-900 dark:text-white">
      <ds-button
        variant="secondary"
        disabled={phase === "loading" || undefined}
        onClick={() => setPhase("loading")}
        data-spinner-load
      >
        {phase === "loaded" ? "Reload comments" : "Load comments"}
      </ds-button>

      <section
        aria-label="Comments"
        aria-busy={phase === "loading"}
        className="grid min-h-40 place-items-center rounded-lg border border-slate-200 p-4 dark:border-slate-700"
        data-spinner-region
      >
        {showSpinner && <ds-spinner size="medium" label="Loading comments" data-spinner-subject />}
        {phase === "idle" && <p className="m-0">Comments load on request.</p>}
        {phase === "loaded" && (
          <ul className="m-0 w-full list-none p-0" data-spinner-comments>
            {COMMENTS.map((comment) => (
              <li
                key={comment}
                className="border-b border-slate-200 py-2 last:border-0 dark:border-slate-700"
              >
                {comment}
              </li>
            ))}
          </ul>
        )}
      </section>

      {phase === "loaded" && (
        <ds-alert variant="success" announce="polite" data-spinner-outcome>
          Loaded {COMMENTS.length} comments.
        </ds-alert>
      )}
    </div>
  );
}
