import * as React from "react";
import { Switch } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/switch.stories.js.
const Updates = (props: React.ComponentProps<typeof Switch>) => (
  <Switch name="notifications" value="on" label="Email me about updates" {...props} />
);

export const Default = () => <Updates />;

export const Checked = () => <Updates checked />;

export const WithHint = () => (
  <Updates label="Desktop notifications" hint="Changes apply immediately." />
);

export const WithError = () => <Updates error="Notifications could not be saved. Try again." />;

export const Disabled = () => <Updates disabled />;
