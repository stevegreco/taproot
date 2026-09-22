/**
 * Verify: Find `[data-link-example]`. Require its inline `ds-link` to render an inner `a` with
 * `href="#link-billing"` and an underline, and its standalone `ds-link` to have no underline at
 * rest. Click View billing history and require `[data-link-status]` to read
 * `Followed #link-billing.` The anchor lives in shadow DOM; query the host, then the inner `a`.
 */
import { useEffect, useState } from "react";
import "@stevegreco/design-system-components";

export default function LinkExample() {
  const [followed, setFollowed] = useState("");

  useEffect(() => {
    const update = () => setFollowed(window.location.hash);
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  return (
    <div className="flex flex-col gap-8 p-6 text-slate-900 dark:text-white" data-link-example>
      <p className="m-0 max-w-prose">
        Components resolve themes through the semantic layer. Read the{" "}
        <ds-link href="#link-adr">token tier ADR</ds-link> before adding a component-token
        namespace.
      </p>

      <div className="flex flex-col items-start gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <ds-button>Save changes</ds-button>
          <ds-button variant="secondary">Cancel</ds-button>
        </div>
        <ds-link href="#link-billing" variant="standalone">
          View billing history
        </ds-link>
      </div>

      <p className="m-0 text-sm text-slate-600 dark:text-slate-300" data-link-status>
        {followed ? `Followed ${followed}.` : "Follow a link to see its destination."}
      </p>
    </div>
  );
}
