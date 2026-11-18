import * as React from "react";
import { Checkbox } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/checkbox.stories.js.
export const Default = () => <Checkbox label="Email me about updates" />;

export const Checked = () => <Checkbox label="Email me about updates" checked />;

export const Indeterminate = () => <Checkbox label="All channels" indeterminate />;

export const WithHint = () => (
  <Checkbox label="I agree to the terms" hint="You can withdraw at any time." />
);

export const WithError = () => (
  <Checkbox label="I agree to the terms" required error="Agree to the terms to continue." />
);

export const Disabled = () => <Checkbox label="Email me about updates" disabled />;
