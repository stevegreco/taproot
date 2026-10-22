/**
 * Verify: run the steps in `divider.verify.js`. The docs tests run them against the built site.
 */
import "@stevegreco/design-system-components";
import { defineDivider } from "@stevegreco/design-system-components/divider";

// The package root registers every component. Divider is registered here until it joins the
// package root's index.
defineDivider();

export default function DividerExample() {
  return (
    <div className="max-w-md p-6 text-slate-900 dark:text-white">
      <ds-card label="Team plan">
        <div className="grid gap-3">
          <p className="m-0">12 of 20 seats used. Renews on 1 March.</p>
          <ds-divider data-divider-subject="sections" />
          <p className="m-0">Billed annually to the card ending 4242.</p>
        </div>
        <div slot="actions" className="flex items-center gap-2" data-divider-actions>
          <ds-button variant="tertiary" size="small">
            Add seats
          </ds-button>
          <ds-button variant="tertiary" size="small">
            Change plan
          </ds-button>
          <ds-divider orientation="vertical" data-divider-subject="actions" />
          <ds-button variant="tertiary" size="small">
            Download invoice
          </ds-button>
        </div>
      </ds-card>
    </div>
  );
}
