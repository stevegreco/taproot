import { html } from "lit";
// The package root registers every component. Divider is registered here until
// it joins the package root's index.
import { defineDivider } from "@stevegreco/design-system-components/divider";

defineDivider();

const ORIENTATION_VALUES = ["horizontal", "vertical"];

export default {
  title: "Components/Divider",
  component: "ds-divider",
  argTypes: {
    orientation: { control: "select", options: ORIENTATION_VALUES },
  },
  args: { orientation: "horizontal" },
  render: (args) => html`
    <div
      style=${
        args.orientation === "vertical"
          ? "display: flex; gap: 16px; block-size: 48px; align-items: center"
          : "display: grid; gap: 16px; max-inline-size: 360px"
      }
    >
      <span>First group</span>
      <ds-divider orientation=${args.orientation}></ds-divider>
      <span>Second group</span>
    </div>
  `,
};

export const Default = {};

export const Vertical = { args: { orientation: "vertical" } };

export const SectionsOfACard = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <ds-card label="Team plan" style="max-inline-size: 360px">
      <div style="display: grid; gap: 12px">
        <span>12 of 20 seats used. Renews on 1 March.</span>
        <ds-divider></ds-divider>
        <span>Billed annually to the card ending 4242.</span>
      </div>
    </ds-card>
  `,
};

export const BetweenActionGroups = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: flex; align-items: center; gap: 8px">
      <ds-button variant="secondary">Bold</ds-button>
      <ds-button variant="secondary">Italic</ds-button>
      <ds-divider orientation="vertical"></ds-divider>
      <ds-button variant="secondary">Undo</ds-button>
      <ds-button variant="secondary">Redo</ds-button>
    </div>
  `,
};

export const SettingsGroups = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display: grid; gap: 16px; max-inline-size: 360px">
      <ds-switch label="Email notifications"></ds-switch>
      <ds-switch label="Push notifications"></ds-switch>
      <ds-divider></ds-divider>
      <ds-switch label="Share usage data"></ds-switch>
    </div>
  `,
};
