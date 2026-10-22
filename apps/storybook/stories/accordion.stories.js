import { html } from "lit";

const render = ({ exclusive, headingLevel }) => html`<ds-accordion
  ?exclusive=${exclusive}
  heading-level=${headingLevel}
>
  <ds-accordion-section label="How long does delivery take?">
    <p>Most orders arrive in three to five working days.</p>
  </ds-accordion-section>
  <ds-accordion-section label="Can I return an item?" expanded>
    <p>
      Return anything unused within 30 days for a full refund.
      <a href="#returns">Read the returns policy</a>.
    </p>
  </ds-accordion-section>
  <ds-accordion-section label="Is there a warranty?">
    <p>Every product has a two-year warranty against manufacturing faults.</p>
  </ds-accordion-section>
</ds-accordion>`;

export default {
  title: "Components/Accordion",
  component: "ds-accordion",
  argTypes: {
    exclusive: { control: "boolean" },
    headingLevel: { control: { type: "number", min: 2, max: 6 } },
  },
  args: { exclusive: false, headingLevel: 3 },
  render,
};

export const Default = {};
export const Exclusive = { args: { exclusive: true } };
export const AllCollapsed = {
  render: () => html`<ds-accordion>
    ${["Shipping", "Returns", "Warranty"].map(
      (name) =>
        html`<ds-accordion-section label=${name}><p>${name} details.</p></ds-accordion-section>`,
    )}
  </ds-accordion>`,
};
export const LongLabels = {
  render: () => html`<div style="max-width: 320px">
    <ds-accordion>
      <ds-accordion-section
        label="What happens to my data if I close my account before my plan ends?"
      >
        <p>We keep it for 30 days, then delete it.</p>
      </ds-accordion-section>
      <ds-accordion-section label="Short label"><p>Short content.</p></ds-accordion-section>
    </ds-accordion>
  </div>`,
};
export const RightToLeft = {
  render: (args) => html`<div dir="rtl">${render(args)}</div>`,
};
