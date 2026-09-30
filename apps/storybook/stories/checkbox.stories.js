import { html } from "lit";

export default {
  title: "Components/Checkbox",
  component: "ds-checkbox",
  argTypes: {
    label: { control: "text" },
    hint: { control: "text" },
    error: { control: "text" },
    checked: { control: "boolean" },
    indeterminate: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
  args: {
    label: "Email me about updates",
    hint: "",
    error: "",
    checked: false,
    indeterminate: false,
    disabled: false,
    required: false,
  },
  render: ({ label, hint, error, checked, indeterminate, disabled, required }) => html`
    <ds-checkbox
      label=${label}
      hint=${hint}
      error=${error}
      ?checked=${checked}
      ?indeterminate=${indeterminate}
      ?disabled=${disabled}
      ?required=${required}
    ></ds-checkbox>
  `,
};

export const Default = {};

export const Checked = { args: { checked: true } };

export const Indeterminate = { args: { label: "All channels", indeterminate: true } };

export const WithHint = {
  args: { label: "I agree to the terms", hint: "You can withdraw at any time." },
};

export const WithError = {
  args: { label: "I agree to the terms", required: true, error: "Agree to the terms to continue." },
};

export const Disabled = { args: { disabled: true } };
