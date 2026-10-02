import { html } from "lit";

export default {
  title: "Components/Text area",
  component: "ds-text-area",
  argTypes: {
    label: { control: "text" },
    hint: { control: "text" },
    error: { control: "text" },
    name: { control: "text" },
    value: { control: "text" },
    placeholder: { control: "text" },
    autocomplete: { control: "text" },
    rows: { control: "number" },
    readonly: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
  args: {
    label: "Text area",
    hint: "",
    error: "",
    name: "description",
    value: "",
    disabled: false,
    required: false,
    placeholder: "",
    autocomplete: "",
    rows: 4,
    readonly: false,
  },
  render: (args) =>
    html`<div style="max-width: 24rem">
      <ds-text-area
        label=${args.label}
        hint=${args.hint}
        error=${args.error}
        name=${args.name}
        value=${args.value}
        placeholder=${args.placeholder}
        autocomplete=${args.autocomplete}
        ?disabled=${args.disabled}
        ?required=${args.required}
        rows=${args.rows}
        ?readonly=${args.readonly}
      ></ds-text-area>
    </div>`,
};

export const Default = {};
export const WithHint = { args: { hint: "Choose a value for this project." } };
export const WithError = { args: { required: true, error: "Provide a value to continue." } };
export const Disabled = { args: { disabled: true } };
export const Required = { args: { required: true } };
export const Readonly = { args: { readonly: true, value: "Existing project notes." } };
export const Multiline = { args: { rows: 6, value: "First line\nSecond line\nThird line" } };
