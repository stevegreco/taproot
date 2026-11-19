import * as React from "react";
import { Select, type SelectProps } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/select.stories.js with Select from @taproot-ds/react-components.
// Choices go in the `options` prop; a group holds its own `options`.
const options: SelectProps["options"] = [
  { value: "", label: "Choose delivery" },
  {
    label: "Shipping",
    options: [
      { value: "standard", label: "Standard" },
      { value: "express", label: "Express" },
      { value: "overnight", label: "Overnight unavailable", disabled: true },
    ],
  },
];

const Delivery = (props: Partial<SelectProps>) => (
  <div style={{ maxWidth: "24rem" }}>
    <Select label="Select" name="delivery" defaultValue="" options={options} {...props} />
  </div>
);

export const Default = () => <Delivery />;

export const WithHint = () => <Delivery hint="Choose a value for this project." />;

export const WithError = () => <Delivery required error="Provide a value to continue." />;

export const Disabled = () => <Delivery disabled />;

export const Required = () => <Delivery required />;

export const Selected = () => <Delivery defaultValue="express" />;
