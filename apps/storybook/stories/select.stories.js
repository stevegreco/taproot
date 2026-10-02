import { html } from "lit";

export default {
  title: "Components/Select",
  component: "ds-select",
  argTypes: {
    label: { control: "text" },
    hint: { control: "text" },
    error: { control: "text" },
    name: { control: "text" },
    value: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
  args: {
    label: "Select",
    hint: "",
    error: "",
    name: "delivery",
    value: "",
    disabled: false,
    required: false,
  },
  render: (args) =>
    html`<div style="max-width: 24rem">
      <ds-select
        label=${args.label}
        hint=${args.hint}
        error=${args.error}
        name=${args.name}
        value=${args.value}
        ?disabled=${args.disabled}
        ?required=${args.required}
        ><option value="">Choose delivery</option>
        <optgroup label="Shipping">
          <option value="standard">Standard</option>
          <option value="express">Express</option>
          <option value="overnight" disabled>Overnight unavailable</option>
        </optgroup></ds-select
      >
    </div>`,
};

export const Default = {};
export const WithHint = { args: { hint: "Choose a value for this project." } };
export const WithError = { args: { required: true, error: "Provide a value to continue." } };
export const Disabled = { args: { disabled: true } };
export const Required = { args: { required: true } };
export const Selected = { args: { value: "express" } };
