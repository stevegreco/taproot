import { html, svg } from "lit";

const VARIANTS = ["default", "accent", "success", "danger", "warning", "info"];

export default {
  title: "Components/Badge",
  component: "ds-badge",
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    label: { control: "text", description: "Slotted content." },
  },
  args: { variant: "default", label: "Draft" },
  render: ({ variant, label }) => html`<ds-badge variant=${variant}>${label}</ds-badge>`,
};

export const Default = {};

export const Success = { args: { variant: "success", label: "Published" } };

export const Danger = { args: { variant: "danger", label: "Failed" } };

export const AllVariants = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: flex; flex-wrap: wrap; gap: 8px">
      ${VARIANTS.map((variant) => html`<ds-badge variant=${variant}>${variant}</ds-badge>`)}
    </div>
  `,
};

const warning = svg`<svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2 22 21H2zm-1 7v6h2V9zm0 8v2h2v-2z"/></svg>`;

export const WithIcon = {
  args: { variant: "warning", label: "Pending" },
  render: ({ variant, label }) =>
    html`<ds-badge variant=${variant}><ds-icon>${warning}</ds-icon>${label}</ds-badge>`,
};
