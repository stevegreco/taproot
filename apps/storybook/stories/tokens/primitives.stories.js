import { primitives, ramps, select, tokenTable } from "./tokens.js";

export default {
  title: "Tokens/Primitives",
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

export const Color = { render: () => ramps(select(primitives, "primitives.color")) };

export const Typography = {
  render: () =>
    tokenTable(
      select(
        primitives,
        "primitives.font",
        "primitives.text",
        "primitives.weight",
        "primitives.leading",
        "primitives.tracking",
      ),
    ),
};

export const Space = { render: () => tokenTable(select(primitives, "primitives.space")) };

export const Layout = { render: () => tokenTable(select(primitives, "primitives.layout")) };

export const Radius = { render: () => tokenTable(select(primitives, "primitives.radius")) };

export const Border = { render: () => tokenTable(select(primitives, "primitives.border")) };

export const Shadow = {
  render: () => tokenTable(select(primitives, "primitives.shadow", "primitives.shadowInk")),
};

export const Motion = {
  parameters: { docs: { description: { story: "Hover a row to play the motion." } } },
  render: () => tokenTable(select(primitives, "primitives.duration", "primitives.ease")),
};
