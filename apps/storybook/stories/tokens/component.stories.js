import { aliasTable, components, select } from "./tokens.js";

export default {
  title: "Tokens/Component",
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Component tokens alias semantic or primitive tokens to give a component a customization boundary (ADR 0003). Only components that need one publish them.",
      },
    },
  },
};

export const Button = { render: () => aliasTable(select(components, "component.button")) };
