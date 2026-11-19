import * as React from "react";
import { RadioGroup } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/radio-group.stories.js. Options are native <option> children.
const Delivery = (props: React.ComponentProps<typeof RadioGroup>) => (
  <RadioGroup label="Delivery method" name="delivery" value="standard" {...props}>
    <option value="standard">Standard delivery</option>
    <option value="express">Express delivery</option>
    <option value="pickup" disabled>
      Pickup unavailable
    </option>
  </RadioGroup>
);

export const Default = () => <Delivery />;

export const Unselected = () => <Delivery value="" />;

export const WithHint = () => <Delivery hint="Choose how your order arrives." />;

export const WithError = () => <Delivery value="" required error="Choose a delivery method." />;

export const Disabled = () => <Delivery disabled />;
