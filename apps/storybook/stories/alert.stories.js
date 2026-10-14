import { html, svg } from "lit";

const VARIANTS = ["info", "success", "warning", "danger"];
const ANNOUNCE = ["off", "polite", "urgent"];

const icons = {
  info: svg`<svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-1 8v7h2v-7zm0-3v2h2V7z"/></svg>`,
  success: svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12l5 5L20 7"/></svg>`,
  warning: svg`<svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2 22 21H2zm-1 7v6h2V9zm0 8v2h2v-2z"/></svg>`,
  danger: svg`<svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-1 5v7h2V7zm0 9v2h2v-2z"/></svg>`,
};

export default {
  title: "Components/Alert",
  component: "ds-alert",
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    label: { control: "text" },
    message: { control: "text", description: "Slotted content." },
    announce: { control: "select", options: ANNOUNCE },
    dismissible: { control: "boolean" },
    dismissLabel: { control: "text" },
  },
  args: {
    variant: "info",
    label: "A new version is available",
    message: "Reload the page to get the latest features.",
    announce: "off",
    dismissible: false,
    dismissLabel: "Dismiss",
  },
  render: ({ variant, label, message, announce, dismissible, dismissLabel }) => html`
    <ds-alert
      variant=${variant}
      label=${label}
      announce=${announce}
      ?dismissible=${dismissible}
      dismiss-label=${dismissLabel}
    >
      ${message}
    </ds-alert>
  `,
};

export const Default = {};

export const Success = {
  args: {
    variant: "success",
    label: "Changes saved",
    message: "Your profile is up to date.",
    announce: "polite",
    dismissible: true,
  },
};

export const Danger = {
  args: {
    variant: "danger",
    label: "Upload failed",
    message: "The file is larger than 10 MB. Choose a smaller file and try again.",
  },
};

export const MessageOnly = { args: { label: "", message: "Your session expires in 5 minutes." } };

export const AllVariants = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: grid; gap: 12px">
      ${VARIANTS.map(
        (variant) => html`
          <ds-alert
            variant=${variant}
            label=${`${variant[0].toUpperCase()}${variant.slice(1)}`}
            dismissible
          >
            <ds-icon slot="icon">${icons[variant]}</ds-icon>
            A short message that says what happened and what to do next.
          </ds-alert>
        `,
      )}
    </div>
  `,
};

/** Alert inside the components it is used with: Icon, Button, and Link. */
export const Composition = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: grid; gap: 12px; max-width: 560px">
      <ds-alert variant="danger" label="Upload failed" dismissible>
        <ds-icon slot="icon">${icons.danger}</ds-icon>
        The file is larger than 10 MB.
        <ds-button slot="actions" variant="secondary" size="sm">Choose another file</ds-button>
        <ds-button slot="actions" variant="ghost" size="sm">Cancel upload</ds-button>
      </ds-alert>
      <ds-alert variant="warning" label="Billing details needed">
        <ds-icon slot="icon">${icons.warning}</ds-icon>
        Add a payment method before your trial ends on June 30.
        <ds-link slot="actions" href="#billing" variant="standalone">Add payment method</ds-link>
      </ds-alert>
      <ds-alert variant="info">
        <ds-icon slot="icon">${icons.info}</ds-icon>
        A long message wraps within the alert and keeps the icon on its first line, so people
        reading at large text sizes or in narrow layouts still see the status beside the words.
      </ds-alert>
    </div>
  `,
};
