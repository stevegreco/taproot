import { html } from "lit";

const SIZE_VALUES = ["inherit", "small", "medium", "large"];

export default {
  title: "Components/Spinner",
  component: "ds-spinner",
  argTypes: {
    label: { control: "text", description: "Accessible name. Empty reads as Loading." },
    size: { control: "select", options: SIZE_VALUES },
  },
  args: { label: "Loading", size: "large" },
  render: (args) => html`<ds-spinner label=${args.label} size=${args.size}></ds-spinner>`,
};

export const Default = {};

export const AllSizes = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: flex; align-items: flex-end; gap: 16px">
      ${SIZE_VALUES.slice(1).map((size) => html`<ds-spinner size=${size}></ds-spinner>`)}
    </div>
  `,
};

export const BesideText = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <p style="font-size: 14px"><ds-spinner label="Saving draft"></ds-spinner> Saving…</p>
    <p style="font-size: 24px"><ds-spinner label="Uploading photo"></ds-spinner> Uploading…</p>
  `,
};

export const LoadingRegion = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <section
      aria-busy="true"
      style="display: grid; place-items: center; min-block-size: 200px; border: 1px solid var(--ds-semantic-color-border-default); border-radius: var(--ds-semantic-radius-surface)"
    >
      <ds-spinner size="large" label="Loading comments"></ds-spinner>
    </section>
  `,
};

export const OnStatusSurface = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <ds-alert variant="info">
      <ds-spinner slot="icon" label="Importing contacts"></ds-spinner>
      Importing contacts. This can take a few minutes.
    </ds-alert>
  `,
};
