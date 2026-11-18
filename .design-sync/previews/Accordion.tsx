import * as React from "react";
import { Accordion, AccordionSection } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/accordion.stories.js.
const Faq = ({
  exclusive = false,
  headingLevel = 3,
}: {
  exclusive?: boolean;
  headingLevel?: number;
}) => (
  <Accordion exclusive={exclusive} headingLevel={headingLevel}>
    <AccordionSection label="How long does delivery take?">
      <p>Most orders arrive in three to five working days.</p>
    </AccordionSection>
    <AccordionSection label="Can I return an item?" expanded>
      <p>
        Return anything unused within 30 days for a full refund.{" "}
        <a href="#returns">Read the returns policy</a>.
      </p>
    </AccordionSection>
    <AccordionSection label="Is there a warranty?">
      <p>Every product has a two-year warranty against manufacturing faults.</p>
    </AccordionSection>
  </Accordion>
);

export const Default = () => <Faq />;

export const Exclusive = () => <Faq exclusive />;

export const AllCollapsed = () => (
  <Accordion>
    {["Shipping", "Returns", "Warranty"].map((name) => (
      <AccordionSection key={name} label={name}>
        <p>{name} details.</p>
      </AccordionSection>
    ))}
  </Accordion>
);

export const LongLabels = () => (
  <div style={{ maxWidth: 320 }}>
    <Accordion>
      <AccordionSection label="What happens to my data if I close my account before my plan ends?">
        <p>We keep it for 30 days, then delete it.</p>
      </AccordionSection>
      <AccordionSection label="Short label">
        <p>Short content.</p>
      </AccordionSection>
    </Accordion>
  </div>
);

export const RightToLeft = () => (
  <div dir="rtl">
    <Faq />
  </div>
);
