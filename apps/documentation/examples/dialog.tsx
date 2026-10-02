/**
 * Verify: run the steps in `dialog.verify.js`. The docs tests run them against the built site.
 */
import { useRef, useState } from "react";
import "@stevegreco/design-system-components";
import type { DsDialog } from "@stevegreco/design-system-components";

export default function DialogExample() {
  const dialog = useRef<DsDialog>(null);
  const [status, setStatus] = useState("The archived project is available.");
  return (
    <div className="flex flex-col items-start gap-4 p-6 text-slate-900 dark:text-white">
      <ds-button data-dialog-trigger onClick={() => dialog.current?.showModal()} variant="danger">
        Delete archived project
      </ds-button>
      <p data-dialog-status>{status}</p>
      <ds-dialog
        data-dialog-example
        label="Delete archived project?"
        description="Deleting removes its files permanently."
        ref={dialog}
      >
        <p>Other projects remain available.</p>
        <ds-button
          slot="actions"
          variant="secondary"
          data-dialog-cancel
          onClick={() => dialog.current?.close()}
        >
          Cancel
        </ds-button>
        <ds-button
          slot="actions"
          variant="danger"
          data-dialog-confirm
          onClick={() => {
            setStatus("Archived project deleted.");
            dialog.current?.close();
          }}
        >
          Delete project
        </ds-button>
      </ds-dialog>
    </div>
  );
}
