/**
 * Verify: run the steps in `switch.verify.js`. The docs tests run them against the built site.
 */
import { useState } from "react";
import "@stevegreco/design-system-components";
export default function SwitchExample() {
  const [on, setOn] = useState(false);
  return (
    <div className="flex flex-col gap-4 p-6">
      <ds-switch
        data-switch-control
        label="Desktop notifications"
        hint="Changes apply immediately."
        checked={on}
        onChange={(event) =>
          setOn((event.currentTarget as HTMLElement & { checked: boolean }).checked)
        }
      />
      <p data-switch-status>{on ? "Notifications on." : "Notifications off."}</p>
      <ds-switch data-switch-disabled label="Security alerts" checked disabled />
    </div>
  );
}
