import { html } from "lit";

export default {
  title: "Components/Slider",
  component: "ds-slider",
  argTypes: {
    label: { control: "text" },
    hint: { control: "text" },
    error: { control: "text" },
    value: { control: "number" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    name: { control: "text" },
    disabled: { control: "boolean" },
  },
  args: {
    label: "Volume",
    hint: "",
    error: "",
    value: 40,
    min: 0,
    max: 100,
    step: 1,
    name: "volume",
    disabled: false,
  },
  render: (args) =>
    html`<ds-slider
      label=${args.label}
      hint=${args.hint}
      error=${args.error}
      value=${args.value}
      min=${args.min}
      max=${args.max}
      step=${args.step}
      name=${args.name}
      ?disabled=${args.disabled}
    ></ds-slider>`,
};

export const Default = {};

export const WithHint = {
  args: {
    label: "Maximum price (USD)",
    hint: "Shows homes at or below this price.",
    name: "max-price",
    min: 0,
    max: 2000,
    step: 50,
    value: 800,
  },
};

export const WithError = {
  args: { label: "Budget (USD)", value: 90, error: "Choose 50 or less for this plan." },
};

export const Disabled = { args: { disabled: true } };

export const AtMinimum = { args: { value: 0 } };

export const AtMaximum = { args: { value: 100 } };

export const RightToLeft = {
  render: () => html`<div dir="rtl"><ds-slider label="Volume" value="30"></ds-slider></div>`,
};
