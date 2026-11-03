/**
 * Verify: run the steps in `accordion.verify.js`. The docs tests run them against the built site.
 */
import "@stevegreco/web-components";

export default function AccordionExample() {
  return (
    <div className="flex max-w-xl flex-col gap-2 p-6 text-slate-900 dark:text-white">
      <h2 className="text-lg font-semibold">Frequently asked questions</h2>
      <ds-accordion heading-level={3} data-accordion-subject>
        <ds-accordion-section
          label="How long does delivery take?"
          expanded
          data-accordion-section="delivery"
        >
          <p>Most orders arrive in three to five working days.</p>
        </ds-accordion-section>
        <ds-accordion-section label="Can I return an item?" data-accordion-section="returns">
          <p>
            Return anything unused within 30 days for a full refund.{" "}
            <ds-link href="#accordion-returns" data-accordion-returns-link>
              Read the returns policy
            </ds-link>
          </p>
        </ds-accordion-section>
        <ds-accordion-section label="Is there a warranty?" data-accordion-section="warranty">
          <p>Every product has a two-year warranty against manufacturing faults.</p>
        </ds-accordion-section>
      </ds-accordion>
    </div>
  );
}
