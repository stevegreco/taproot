import { html } from "lit";

export default {
  title: "Components/Text field",
  component: "ds-text-field",
  argTypes: {
    label: { control: "text" },
    hint: { control: "text" },
    error: { control: "text" },
    type: { control: "select", options: ["text", "email", "password", "search", "url", "tel"] },
    value: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
  args: {
    label: "Email address",
    hint: "",
    error: "",
    type: "email",
    value: "",
    placeholder: "",
    disabled: false,
    required: false,
  },
  render: ({ label, hint, error, type, value, placeholder, disabled, required }) => html`
    <div style="max-width: 24rem">
      <ds-text-field
        label=${label}
        hint=${hint}
        error=${error}
        type=${type}
        value=${value}
        placeholder=${placeholder}
        ?disabled=${disabled}
        ?required=${required}
      ></ds-text-field>
    </div>
  `,
};

export const Default = {};

export const WithHint = { args: { hint: "We only use this to send receipts." } };

export const WithError = {
  args: { required: true, value: "sam@", error: "Enter an email address like name@example.com." },
};

export const Disabled = { args: { disabled: true, value: "sam@example.com" } };
