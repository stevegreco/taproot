import { html, svg } from "lit";
// The package root does not register ds-tooltip yet, so register it here.
import { defineTooltip } from "@stevegreco/web-components/tooltip";

defineTooltip();

const PLACEMENT_VALUES = ["above", "below"];

const icon = (path) =>
  svg`<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d=${path} /></svg>`;
const trash = icon("M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5");
const pencil = icon("M10.5 2.5l3 3L6 13H3v-3z");
const copy = icon("M5.5 5.5h7v7h-7zM3.5 10.5v-7h7");

const iconButton = (label, graphic, placement = "above") => html`
  <ds-tooltip label=${label} placement=${placement}>
    <ds-button variant="tertiary" size="small"><ds-icon>${graphic}</ds-icon></ds-button>
  </ds-tooltip>
`;

export default {
  title: "Components/Tooltip",
  component: "ds-tooltip",
  argTypes: {
    label: { control: "text" },
    placement: { control: "select", options: PLACEMENT_VALUES },
  },
  args: { label: "Delete row", placement: "above" },
  render: (args) => html`
    <div style="padding: 48px">${iconButton(args.label, trash, args.placement)}</div>
  `,
};

export const Default = {};

export const Below = {
  args: { placement: "below" },
};

export const Toolbar = {
  render: () => html`
    <div style="padding: 48px; display: flex; gap: 4px">
      ${iconButton("Edit row", pencil)} ${iconButton("Duplicate row", copy)}
      ${iconButton("Delete row", trash)}
    </div>
  `,
};

/** Placed above, at the top edge, it moves below so it stays in view. */
export const FlipsAtEdge = {
  render: () => html`
    <div style="display: flex; justify-content: flex-end">${iconButton("Delete row", trash)}</div>
  `,
};

/** The bubble is in the top layer, so the clipping container does not cut it off. */
export const InsideClippedContainer = {
  render: () => html`
    <div style="margin: 48px; width: 40px; height: 40px; overflow: hidden">
      ${iconButton("Remove this row and every row below it", trash)}
    </div>
  `,
};
