import { html, svg } from "lit";

const SIZES = ["inherit", "small", "medium", "large"];

const warning = svg`<svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2 22 21H2zm-1 7v6h2V9zm0 8v2h2v-2z"/></svg>`;
const trash = svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>`;

export default {
  title: "Components/Icon",
  component: "ds-icon",
  argTypes: {
    size: { control: "select", options: SIZES },
    label: { control: "text", description: "Empty means decorative." },
  },
  args: { size: "large", label: "Warning" },
  render: ({ size, label }) =>
    html`<ds-icon size=${size} label=${label || ""}>${warning}</ds-icon>`,
};

export const Default = {};

export const Decorative = { args: { label: "" } };

export const AllSizes = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: flex; align-items: flex-end; gap: 16px">
      ${SIZES.slice(1).map((size) => html`<ds-icon size=${size}>${warning}</ds-icon>`)}
    </div>
  `,
};

export const InheritsTextSize = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <p style="font-size: 14px">Small text <ds-icon>${warning}</ds-icon></p>
    <p style="font-size: 32px">Large text <ds-icon>${warning}</ds-icon></p>
  `,
};

export const InComponents = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px">
      <ds-button variant="destructive"><ds-icon>${trash}</ds-icon>Delete project</ds-button>
      <ds-button variant="secondary" disabled><ds-icon>${trash}</ds-icon>Delete archive</ds-button>
      <ds-badge variant="warning"><ds-icon>${warning}</ds-icon> Pending</ds-badge>
    </div>
  `,
};
