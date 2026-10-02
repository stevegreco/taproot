import { html } from "lit";

export default {
  title: "Components/Switch",
  component: "ds-switch",
  argTypes: {
    label: { control: "text" },
    hint: { control: "text" },
    error: { control: "text" },
    name: { control: "text" },
    value: { control: "text" },
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    label: "Email me about updates",
    hint: "",
    error: "",
    name: "notifications",
    value: "on",
    checked: false,
    disabled: false,
  },
  render: ({ label, hint, error, checked, disabled, name, value }) => html`
    <ds-switch
      name=${name}
      value=${value}
      label=${label}
      hint=${hint}
      error=${error}
      ?checked=${checked}
      ?disabled=${disabled}
    ></ds-switch>
  `,
};

export const Default = {};

export const Checked = { args: { checked: true } };

export const WithHint = {
  args: { label: "Desktop notifications", hint: "Changes apply immediately." },
};

export const WithError = { args: { error: "Notifications could not be saved. Try again." } };

export const Disabled = { args: { disabled: true } };
