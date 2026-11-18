import * as React from "react";
import { Alert, Button, Icon, Link } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/alert.stories.js.
const icons = {
  info: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-1 8v7h2v-7zm0-3v2h2V7z"
      />
    </svg>
  ),
  success: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M12 2 22 21H2zm-1 7v6h2V9zm0 8v2h2v-2z" />
    </svg>
  ),
  danger: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-1 5v7h2V7zm0 9v2h2v-2z"
      />
    </svg>
  ),
};

export const Default = () => (
  <Alert variant="info" label="A new version is available" announce="off" dismissLabel="Dismiss">
    Reload the page to get the latest features.
  </Alert>
);

export const Success = () => (
  <Alert
    variant="success"
    label="Changes saved"
    announce="polite"
    dismissible
    dismissLabel="Dismiss"
  >
    Your profile is up to date.
  </Alert>
);

export const Danger = () => (
  <Alert variant="danger" label="Upload failed" announce="off" dismissLabel="Dismiss">
    The file is larger than 10 MB. Choose a smaller file and try again.
  </Alert>
);

export const MessageOnly = () => (
  <Alert variant="info" label="" announce="off" dismissLabel="Dismiss">
    Your session expires in 5 minutes.
  </Alert>
);

export const AllVariants = () => (
  <div style={{ display: "grid", gap: 12 }}>
    {(["info", "success", "warning", "danger"] as const).map((variant) => (
      <Alert
        key={variant}
        variant={variant}
        label={variant[0].toUpperCase() + variant.slice(1)}
        dismissible
      >
        <Icon slot="icon">{icons[variant]}</Icon>
        A short message that says what happened and what to do next.
      </Alert>
    ))}
  </div>
);

export const Composition = () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
    <Alert variant="danger" label="Upload failed" dismissible>
      <Icon slot="icon">{icons.danger}</Icon>
      The file is larger than 10 MB.
      <Button slot="actions" variant="secondary" size="small">
        Choose another file
      </Button>
      <Button slot="actions" variant="tertiary" size="small">
        Cancel upload
      </Button>
    </Alert>
    <Alert variant="warning" label="Billing details needed">
      <Icon slot="icon">{icons.warning}</Icon>
      Add a payment method before your trial ends on June 30.
      <Link slot="actions" href="#billing" variant="standalone">
        Add payment method
      </Link>
    </Alert>
    <Alert variant="info">
      <Icon slot="icon">{icons.info}</Icon>
      A long message wraps within the alert and keeps the icon on its first line, so people reading
      at large text sizes or in narrow layouts still see the status beside the words.
    </Alert>
  </div>
);
