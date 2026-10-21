import { html } from "lit";
export default {
  title: "Components/Dialog",
  component: "ds-dialog",
  argTypes: {
    open: { control: "boolean" },
    label: { control: "text" },
    description: { control: "text" },
    dismissible: { control: "boolean" },
  },
  args: {
    open: false,
    label: "Delete archived project?",
    description: "Deleting removes its files permanently.",
    dismissible: true,
  },
  render: ({ open, label, description, dismissible }) => html` <ds-button
      @click=${(event) => event.currentTarget.nextElementSibling.showModal()}
      >Open dialog</ds-button
    >
    <ds-dialog
      ?open=${open}
      label=${label}
      description=${description}
      dismissible=${String(dismissible)}
    >
      <p>Other projects remain available.</p>
      <ds-button
        slot="actions"
        variant="secondary"
        @click=${(event) => event.currentTarget.closest("ds-dialog").close()}
        >Cancel</ds-button
      >
      <ds-button
        slot="actions"
        variant="destructive"
        @click=${(event) => event.currentTarget.closest("ds-dialog").close()}
        >Delete project</ds-button
      >
    </ds-dialog>`,
};
export const Default = {};
export const Open = { args: { open: true } };
export const WithoutDescription = { args: { open: true, description: "" } };
export const ExplicitCloseOnly = { args: { open: true, dismissible: false } };
