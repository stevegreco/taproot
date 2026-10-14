/**
 * Verify: run the steps in `alert.verify.js`. The docs tests run them against the built site.
 */
import { useState } from "react";
import "@stevegreco/design-system-components";
import type { DsAlert } from "@stevegreco/design-system-components";

const warning = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2 22 21H2zm-1 7v6h2V9zm0 8v2h2v-2z" fillRule="evenodd" />
  </svg>
);

const check = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

export default function AlertExample() {
  const [savedCount, setSavedCount] = useState(0);

  // Dismissing hides the alert. Clearing state then removes it, so the next save inserts a fresh
  // alert that is announced again.
  const onDismiss = (alert: DsAlert | null) => {
    if (!alert) return;
    const clear = () => setSavedCount(0);
    alert.addEventListener("dismiss", clear);
    return () => alert.removeEventListener("dismiss", clear);
  };

  return (
    <div className="flex max-w-xl flex-col gap-4 p-6 text-slate-900 dark:text-white">
      <ds-alert variant="warning" label="Billing details needed" data-alert-onload>
        <ds-icon slot="icon">{warning}</ds-icon>
        Add a payment method before your trial ends on June 30.
        <ds-link slot="actions" href="#alert-billing" variant="standalone">
          Add payment method
        </ds-link>
      </ds-alert>

      {savedCount > 0 && (
        <ds-alert
          ref={onDismiss}
          variant="success"
          label="Changes saved"
          announce="polite"
          dismissible
          data-alert-saved
        >
          <ds-icon slot="icon">{check}</ds-icon>
          Your notification settings are up to date.
        </ds-alert>
      )}

      <ds-button data-alert-save onClick={() => setSavedCount((count) => count + 1)}>
        Save settings
      </ds-button>
    </div>
  );
}
