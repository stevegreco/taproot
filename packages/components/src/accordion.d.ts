/** The attributes `<ds-accordion>` accepts, for typing framework templates. */
export interface DsAccordionAttributes {
  /** Expanding a section collapses the one that was expanded. */
  exclusive?: boolean;
  /** The heading level of every trigger, from 2 to 6. Defaults to `3`. */
  "heading-level"?: number;
}

/** The attributes `<ds-accordion-section>` accepts, for typing framework templates. */
export interface DsAccordionSectionAttributes {
  /** The visible text of this section's trigger. */
  label?: string;
  /** Whether the section is expanded. */
  expanded?: boolean;
}

/** Detail of the `toggle` event `<ds-accordion>` dispatches. */
export interface DsAccordionToggleDetail {
  /** The section that expanded or collapsed. Read its `expanded` property for the new state. */
  section: DsAccordionSection;
}

/** `<ds-accordion>`: Use Accordion to let people expand only the sections of a long page they need, one heading at a time. */
export declare class DsAccordion extends HTMLElement {
  exclusive: boolean;
  /** From 2 to 6. Any other value reads as `3`. */
  headingLevel: number;
  /** Focuses the first trigger. */
  focus(options?: FocusOptions): void;
  blur(): void;
}

/** `<ds-accordion-section>`: one section of a `<ds-accordion>`, supplying its trigger's label and its content. */
export declare class DsAccordionSection extends HTMLElement {
  label: string;
  expanded: boolean;
}

/**
 * Registers `<ds-accordion>` and `<ds-accordion-section>`, or aliases when given tag names. Safe to
 * call more than once.
 */
export declare function defineAccordion(tagName?: string, sectionTagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-accordion": DsAccordion;
    "ds-accordion-section": DsAccordionSection;
  }
}
