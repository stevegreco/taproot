import { select, semanticLight, tokenTable, typeSpecimens } from "./tokens.js";

export default {
  title: "Tokens/Semantic",
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Semantic tokens resolve per theme. Previews follow the Theme toolbar; the table lists both values.",
      },
    },
  },
};

const themed = (...prefixes) => tokenTable(select(semanticLight, ...prefixes), { themed: true });

export const Background = { render: () => themed("semantic.color.background") };

export const Foreground = { render: () => themed("semantic.color.foreground") };

export const Border = { render: () => themed("semantic.color.border") };

export const Elevation = { render: () => themed("semantic.elevation") };

export const Radius = { render: () => themed("semantic.radius") };

export const Typography = {
  render: () => typeSpecimens(select(semanticLight, "semantic.typography")),
};
