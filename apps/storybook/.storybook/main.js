/** @type {import("@storybook/web-components-vite").StorybookConfig} */
export default {
  framework: "@storybook/web-components-vite",
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.js"],
  core: { disableTelemetry: true },
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
};
