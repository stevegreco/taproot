import { html } from "lit";
export default {
  title: "Components/Radio group",
  component: "ds-radio-group",
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
    label: "Delivery method",
    hint: "",
    error: "",
    name: "delivery",
    value: "standard",
    disabled: false,
    required: false,
  },
  render: ({ label, hint, error, name, value, disabled, required }) => html` <ds-radio-group
    label=${label}
    hint=${hint}
    error=${error}
    name=${name}
    value=${value}
    ?disabled=${disabled}
    ?required=${required}
  >
    <option value="standard">Standard delivery</option>
    <option value="express">Express delivery</option>
    <option value="pickup" disabled>Pickup unavailable</option>
  </ds-radio-group>`,
};
export const Default = {};
export const Unselected = { args: { value: "" } };
export const WithHint = { args: { hint: "Choose how your order arrives." } };
export const WithError = {
  args: { value: "", required: true, error: "Choose a delivery method." },
};
export const Disabled = { args: { disabled: true } };
