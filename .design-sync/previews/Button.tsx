import * as React from "react";
import { Button } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/button.stories.js.
export const Primary = () => (
  <Button variant="primary" size="medium" type="button">
    Save changes
  </Button>
);

export const Secondary = () => <Button variant="secondary">Preview</Button>;

export const Tertiary = () => <Button variant="tertiary">Cancel</Button>;

export const Destructive = () => <Button variant="destructive">Delete draft</Button>;

export const Disabled = () => <Button disabled>Publish</Button>;

export const Small = () => <Button size="small">Save changes</Button>;

export const AllVariants = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
    <Button>Save changes</Button>
    <Button variant="secondary">Preview</Button>
    <Button variant="tertiary">Cancel</Button>
    <Button variant="destructive">Delete draft</Button>
    <Button disabled>Publish</Button>
  </div>
);
