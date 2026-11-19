import * as React from "react";
import { Button, Card, Divider, Switch } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/divider.stories.js.
export const Default = () => (
  <div style={{ display: "grid", gap: 16, maxInlineSize: 360 }}>
    <span>First group</span>
    <Divider orientation="horizontal" />
    <span>Second group</span>
  </div>
);

export const Vertical = () => (
  <div style={{ display: "flex", gap: 16, blockSize: 48, alignItems: "center" }}>
    <span>First group</span>
    <Divider orientation="vertical" />
    <span>Second group</span>
  </div>
);

export const SectionsOfACard = () => (
  <Card label="Team plan" style={{ maxInlineSize: 360 }}>
    <div style={{ display: "grid", gap: 12 }}>
      <span>12 of 20 seats used. Renews on 1 March.</span>
      <Divider />
      <span>Billed annually to the card ending 4242.</span>
    </div>
  </Card>
);

export const BetweenActionGroups = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <Button variant="secondary">Bold</Button>
    <Button variant="secondary">Italic</Button>
    <Divider orientation="vertical" />
    <Button variant="secondary">Undo</Button>
    <Button variant="secondary">Redo</Button>
  </div>
);

export const SettingsGroups = () => (
  <div style={{ display: "grid", gap: 16, maxInlineSize: 360 }}>
    <Switch label="Email notifications" />
    <Switch label="Push notifications" />
    <Divider />
    <Switch label="Share usage data" />
  </div>
);
