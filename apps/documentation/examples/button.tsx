/**
 * Verify: run the steps in `button.verify.js`. The docs tests run them against the built site.
 */
import { useState } from "react";
import "@stevegreco/web-components";

export default function ButtonExample() {
  const [saves, setSaves] = useState(0);

  return (
    <div className="flex flex-col gap-6 p-6 text-slate-900 dark:text-white">
      <div className="flex flex-wrap items-center gap-3">
        <ds-button onClick={() => setSaves((count) => count + 1)}>Save changes</ds-button>
        <ds-button variant="secondary">Preview</ds-button>
        <ds-button variant="tertiary">Cancel</ds-button>
        <ds-button variant="destructive">Delete draft</ds-button>
        <ds-button disabled>Publish</ds-button>
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-300">
        <p className="m-0">
          Saved {saves} {saves === 1 ? "time" : "times"}.
        </p>
        <p className="m-0">Publish is unavailable until the draft is reviewed.</p>
      </div>
    </div>
  );
}
