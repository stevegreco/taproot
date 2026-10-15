import { html } from "lit";
const render = ({ label, value }) => html`<ds-tabs label=${label} value=${value}>
  <ds-tab-panel label="Profile" value="profile">
    <p>Your name, photo, and contact details.</p>
  </ds-tab-panel>
  <ds-tab-panel label="Notifications" value="notifications">
    <p>Choose which updates reach you by email.</p>
  </ds-tab-panel>
  <ds-tab-panel label="Billing" value="billing">
    <p>Your plan, payment method, and invoices.</p>
  </ds-tab-panel>
</ds-tabs>`;
export default {
  title: "Components/Tabs",
  component: "ds-tabs",
  argTypes: {
    label: { control: "text" },
    value: { control: "select", options: ["profile", "notifications", "billing"] },
  },
  args: {
    label: "Account settings",
    value: "profile",
  },
  render,
};
export const Default = {};
export const SecondSelected = { args: { value: "notifications" } };
export const Overflowing = {
  render: ({ label }) => html`<div style="max-width: 320px">
    <ds-tabs label=${label}>
      ${["Overview", "Activity", "Members", "Permissions", "Integrations", "Settings"].map(
        (name) => html`<ds-tab-panel label=${name}><p>${name} content.</p></ds-tab-panel>`,
      )}
    </ds-tabs>
  </div>`,
};
export const RightToLeft = {
  render: (args) => html`<div dir="rtl">${render(args)}</div>`,
};
