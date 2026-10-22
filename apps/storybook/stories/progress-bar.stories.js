import { html } from "lit";

export default {
  title: "Components/Progress bar",
  component: "ds-progress-bar",
  argTypes: {
    label: { control: "text", description: "Visible text that names the task. Required." },
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    max: { control: "number" },
  },
  args: { label: "Uploading report.pdf", value: 40, max: 100 },
  render: (args) =>
    html`<ds-progress-bar
      label=${args.label}
      value=${args.value}
      max=${args.max}
    ></ds-progress-bar>`,
};

export const Default = {};

export const Empty = { args: { label: "Waiting to upload", value: 0 } };

export const Complete = { args: { label: "Upload complete", value: 100 } };

export const CustomMax = {
  args: { label: "Importing 3 of 12 contacts", value: 3, max: 12 },
};

export const RightToLeft = {
  render: (args) => html`<div dir="rtl">
    <ds-progress-bar label="جارٍ رفع الملف" value=${args.value} max=${args.max}></ds-progress-bar>
  </div>`,
};
