import { html } from "lit";

export default {
  title: "Components/Link",
  component: "ds-link",
  argTypes: {
    href: { control: "text" },
    variant: { control: "inline-radio", options: ["inline", "standalone"] },
    label: { control: "text", description: "Slotted content." },
  },
  args: { href: "#", variant: "standalone", label: "View release notes" },
  render: ({ href, variant, label }) =>
    html`<ds-link href=${href} variant=${variant}>${label}</ds-link>`,
};

export const Standalone = {};

export const Inline = {
  args: { variant: "inline", label: "privacy policy" },
  render: ({ href, variant, label }) => html`
    <p>Read our <ds-link href=${href} variant=${variant}>${label}</ds-link> before you continue.</p>
  `,
};
