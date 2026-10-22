import { html } from "lit";

export default {
  title: "Components/Button",
  component: "ds-button",
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "tertiary", "destructive"],
    },
    size: { control: "inline-radio", options: ["small", "medium"] },
    type: { control: "inline-radio", options: ["button", "submit", "reset"] },
    disabled: { control: "boolean" },
    fullWidth: { name: "full-width", control: "boolean" },
    label: { control: "text", description: "Slotted content." },
  },
  args: {
    variant: "primary",
    size: "medium",
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

export const Tertiary = { args: { variant: "tertiary", label: "Cancel" } };

export const Destructive = { args: { variant: "destructive", label: "Delete draft" } };

export const Disabled = { args: { disabled: true, label: "Publish" } };

export const Small = { args: { size: "small" } };

export const AllVariants = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
      <ds-button>Save changes</ds-button>
      <ds-button variant="secondary">Preview</ds-button>
      <ds-button variant="tertiary">Cancel</ds-button>
      <ds-button variant="destructive">Delete draft</ds-button>
      <ds-button disabled>Publish</ds-button>
    </div>
  `,
};
