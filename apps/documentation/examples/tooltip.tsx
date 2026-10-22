/**
 * Verify: run the steps in `tooltip.verify.js`. The docs tests run them against the built site.
 */
import { useState } from "react";
import "@stevegreco/design-system-components";
// The package root does not register ds-tooltip yet, so register it here.
import {
  defineTooltip,
  type DsTooltipAttributes,
} from "@stevegreco/design-system-components/tooltip";

defineTooltip();

// The package root does not list ds-tooltip's attributes yet either. Identical declarations merge,
// so this keeps compiling once it does.
declare module "@stevegreco/design-system-components" {
  interface ElementAttributes {
    "ds-tooltip": DsTooltipAttributes;
  }
}

const icon = (path: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d={path} />
  </svg>
);

const actions = [
  { id: "rename", label: "Rename file", graphic: icon("M15 4l5 5L9 20H4v-5z") },
  { id: "download", label: "Download file", graphic: icon("M12 4v11M7 10l5 5 5-5M5 20h14") },
  {
    id: "delete",
    label: "Delete file",
    graphic: icon("M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"),
  },
];

export default function TooltipExample() {
  const [deleted, setDeleted] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="flex max-w-xl flex-col gap-4 p-6 pt-12 text-slate-900 dark:text-white">
      {deleted ? (
        <p className="m-0" data-tooltip-deleted>
          Q3 report.pdf was deleted.{" "}
          <ds-button variant="tertiary" size="sm" onClick={() => setDeleted(false)}>
            Undo
          </ds-button>
        </p>
      ) : (
        <div
          className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-2 dark:border-slate-700"
          data-tooltip-row
        >
          <span>Q3 report.pdf</span>
          <span className="flex gap-1">
            {actions.map((action) => (
              <ds-tooltip key={action.id} label={action.label} data-tooltip-subject={action.id}>
                <ds-button
                  variant="tertiary"
                  size="sm"
                  onClick={() =>
                    action.id === "delete" ? setDeleted(true) : setMessage(`${action.label}…`)
                  }
                >
                  <ds-icon>{action.graphic}</ds-icon>
                </ds-button>
              </ds-tooltip>
            ))}
          </span>
        </div>
      )}
      <p role="status" className="m-0">
        {message}
      </p>
    </div>
  );
}
