import * as React from "react";
import { Avatar } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/avatar.stories.js. A stand-in portrait, so no network.
const PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#8fb3a4"/><circle cx="32" cy="26" r="12" fill="#f1d4b8"/><path d="M10 64a22 22 0 0 1 44 0z" fill="#3f5f53"/></svg>',
)}`;

export const Default = () => <Avatar name="Ada Lovelace" image={PORTRAIT} size="large" />;

export const Initials = () => <Avatar name="Ada Lovelace" image="" size="large" />;

export const Placeholder = () => <Avatar name="" image="" size="large" />;

export const BrokenPicture = () => (
  <Avatar name="Ada Lovelace" image="/does-not-exist.png" size="large" />
);

export const AllSizes = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    {(["small", "medium", "large"] as const).map((size) => (
      <React.Fragment key={size}>
        <Avatar size={size} name="Ada Lovelace" image={PORTRAIT} />
        <Avatar size={size} name="Grace Hopper" />
        <Avatar size={size} />
      </React.Fragment>
    ))}
  </div>
);

export const BesideName = () => (
  <p style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
    <Avatar size="small" name="Ada Lovelace" image={PORTRAIT} decorative />
    <strong>Ada Lovelace</strong> commented
  </p>
);
