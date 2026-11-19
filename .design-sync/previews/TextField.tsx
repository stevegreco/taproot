import * as React from "react";
import { TextField } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/text-field.stories.js.
const Email = (props: React.ComponentProps<typeof TextField>) => (
  <div style={{ maxWidth: "24rem" }}>
    <TextField label="Email address" type="email" value="" placeholder="" {...props} />
  </div>
);

export const Default = () => <Email />;

export const WithHint = () => <Email hint="We only use this to send receipts." />;

export const WithError = () => (
  <Email required value="sam@" error="Enter an email address like name@example.com." />
);

export const Disabled = () => <Email disabled value="sam@example.com" />;
