import * as React from "react";
import { Select } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/select.stories.js. Options are native <option>/<optgroup> children.
const Delivery = (props: React.ComponentProps<typeof Select>) => (
  <div style={{ maxWidth: "24rem" }}>
    <Select label="Select" name="delivery" value="" {...props}>
      <option value="">Choose delivery</option>
      <optgroup label="Shipping">
        <option value="standard">Standard</option>
        <option value="express">Express</option>
        <option value="overnight" disabled>
          Overnight unavailable
        </option>
      </optgroup>
    </Select>
  </div>
);

export const Default = () => <Delivery />;

export const WithHint = () => <Delivery hint="Choose a value for this project." />;

export const WithError = () => <Delivery required error="Provide a value to continue." />;

export const Disabled = () => <Delivery disabled />;

export const Required = () => <Delivery required />;

export const Selected = () => <Delivery value="express" />;
