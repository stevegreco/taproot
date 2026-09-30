import { html } from "lit";

export default {
  title: "Components/Button",
  component: "ds-button",
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary", "ghost", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
    type: { control: "inline-radio", options: ["button", "submit", "reset"] },
    disabled: { control: "boolean" },
    fullWidth: { name: "full-width", control: "boolean" },
    label: { control: "text", description: "Slotted content." },
  },
  args: {
    variant: "primary",
    size: "md",
    type: "button",
    disabled: false,
    fullWidth: false,
    label: "Save changes",
  },
  render: ({ variant, size, type, disabled, fullWidth, label }) => html`
    <ds-button
      variant=${variant}
      size=${size}
      type=${type}
      ?disabled=${disabled}
      ?full-width=${fullWidth}
      >${label}</ds-button
    >
  `,
};

export const Primary = {};

export const Secondary = { args: { variant: "secondary", label: "Preview" } };

export const Ghost = { args: { variant: "ghost", label: "Cancel" } };

export const Danger = { args: { variant: "danger", label: "Delete draft" } };

export const Disabled = { args: { disabled: true, label: "Publish" } };

export const Small = { args: { size: "sm" } };

export const AllVariants = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
      <ds-button>Save changes</ds-button>
      <ds-button variant="secondary">Preview</ds-button>
      <ds-button variant="ghost">Cancel</ds-button>
      <ds-button variant="danger">Delete draft</ds-button>
      <ds-button disabled>Publish</ds-button>
    </div>
  `,
};
