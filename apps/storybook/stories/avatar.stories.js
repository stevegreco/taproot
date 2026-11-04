import { html } from "lit";
import { defineAvatar } from "@taproot-ds/web-components/avatar";

// The package root registers every component; Avatar is registered here until it joins the root.
defineAvatar();

const SIZE_VALUES = ["small", "medium", "large"];

// A stand-in portrait, so the stories need no network.
const PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#8fb3a4"/><circle cx="32" cy="26" r="12" fill="#f1d4b8"/><path d="M10 64a22 22 0 0 1 44 0z" fill="#3f5f53"/></svg>',
)}`;

export default {
  title: "Components/Avatar",
  component: "ds-avatar",
  argTypes: {
    name: { control: "text", description: "Accessible name, and the source of the initials." },
    image: { control: "text", description: "Picture URL. Initials show without it." },
    size: { control: "select", options: SIZE_VALUES },
    decorative: { control: "boolean" },
  },
  args: { name: "Ada Lovelace", image: PORTRAIT, size: "large", decorative: false },
  render: (args) =>
    html`<ds-avatar
      name=${args.name}
      image=${args.image}
      size=${args.size}
      ?decorative=${args.decorative}
    ></ds-avatar>`,
};

export const Default = {};

export const Initials = {
  args: { image: "" },
};

export const Placeholder = {
  args: { name: "", image: "" },
};

export const BrokenPicture = {
  args: { image: "/does-not-exist.png" },
};

export const AllSizes = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: flex; align-items: center; gap: 16px">
      ${SIZE_VALUES.map(
        (size) => html`
          <ds-avatar size=${size} name="Ada Lovelace" image=${PORTRAIT}></ds-avatar>
          <ds-avatar size=${size} name="Grace Hopper"></ds-avatar>
          <ds-avatar size=${size}></ds-avatar>
        `,
      )}
    </div>
  `,
};

export const BesideName = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <p style="display: flex; align-items: center; gap: 8px; margin: 0">
      <ds-avatar size="small" name="Ada Lovelace" image=${PORTRAIT} decorative></ds-avatar>
      <strong>Ada Lovelace</strong> commented
    </p>
  `,
};
