/**
 * <ds-accordion> — Use Accordion to let people expand only the sections of a long page they need, one heading at a time.
 *
 * Behavior is in the spec: `pnpm spec get component.accordion`.
 */

// Generated from src/accordion.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/accordion.styles.js";
import {
  Base,
  ForwardsFocus,
  defineElement,
  focusTarget,
  lazyStyleSheet,
} from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);

/** Called by a section when it connects, since sections parsed with the accordion upgrade after it. */
const sectionsChanged = Symbol("sectionsChanged");

/** One section of an accordion. It supplies its trigger's label and its expanded state. */
export class DsAccordionSection extends Base {
  connectedCallback() {
    this.parentElement?.[sectionsChanged]?.();
  }
  get label() {
    return this.getAttribute("label") ?? "";
  }
  set label(value) {
    this.setAttribute("label", value ?? "");
  }
  get expanded() {
    return this.hasAttribute("expanded");
  }
  set expanded(value) {
    this.toggleAttribute("expanded", Boolean(value));
  }
}

/** A stack of sections, each with a heading that expands or collapses it in place. */
export class DsAccordion extends ForwardsFocus(Base) {
  static observedAttributes = ["exclusive", "heading-level"];
  #root;
  #observer;

  constructor() {
    super();
    // Manual assignment puts each section in its own panel.
    this.#root = this.attachShadow({ mode: "open", slotAssignment: "manual" });
    this.#root.adoptedStyleSheets = [styleSheet()];
    this.#root.addEventListener("click", (event) => {
      const trigger = event.target.closest('[part="trigger"]');
      if (trigger) this.#toggle(this.#triggers().indexOf(trigger));
    });
    this.#observer = new MutationObserver((records) => {
      // Sections added, removed, relabeled, or expanded; changes inside a section are not ours.
      const ours = records.filter((record) =>
        record.type === "childList" ? record.target === this : record.target.parentElement === this,
      );
      if (ours.some((record) => record.type === "childList" || record.attributeName === "label")) {
        this.#render();
        return;
      }
      const opened = ours.findLast((record) => record.target.expanded)?.target;
      if (ours.length > 0) this.#sync(opened);
    });
  }

  connectedCallback() {
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["label", "expanded"],
    });
    this.#render();
  }
  disconnectedCallback() {
    this.#observer.disconnect();
  }
  attributeChangedCallback() {
    if (this.isConnected) this.#sync();
  }
  [sectionsChanged]() {
    this.#render();
  }
  get [focusTarget]() {
    return this.#triggers()[0];
  }
  focus(options) {
    this[focusTarget]?.focus(options);
  }
  blur() {
    this.#root.activeElement?.blur();
  }
  get exclusive() {
    return this.hasAttribute("exclusive");
  }
  set exclusive(value) {
    this.toggleAttribute("exclusive", Boolean(value));
  }
  /** From 2 to 6. Any other value reads as 3. */
  get headingLevel() {
    const level = Number(this.getAttribute("heading-level"));
    return Number.isInteger(level) && level >= 2 && level <= 6 ? level : 3;
  }
  set headingLevel(value) {
    this.setAttribute("heading-level", value);
  }

  #sections() {
    return [...this.children].filter((child) => child instanceof DsAccordionSection);
  }
  #triggers() {
    return [...this.#root.querySelectorAll('[part="trigger"]')];
  }
  #render() {
    const focused = this.#triggers().indexOf(this.#root.activeElement);
    this.#root.replaceChildren(
      ...this.#sections().map((section, index) => {
        const item = document.createElement("div");
        item.className = "section";
        item.setAttribute("part", "section");
        item.innerHTML = `<div role="heading"><button type="button" part="trigger"
            id="trigger-${index}" aria-controls="panel-${index}"><span class="label"></span><span
            part="indicator" aria-hidden="true"></span></button></div>
          <div part="panel" role="region" id="panel-${index}"
            aria-labelledby="trigger-${index}"><slot></slot></div>`;
        item.querySelector(".label").textContent = section.label;
        return item;
      }),
    );
    // Assign once the slots are in the shadow root; Chromium can drop an earlier assignment.
    const slots = this.#root.querySelectorAll("slot");
    for (const [index, section] of this.#sections().entries()) slots[index].assign(section);
    this.#sync();
    if (focused !== -1) (this.#triggers()[focused] ?? this[focusTarget])?.focus();
  }
  /** Apply each section's state. In exclusive mode `opened`, or else the first, stays expanded. */
  #sync(opened) {
    const sections = this.#sections();
    if (this.exclusive) {
      const keep = opened ?? sections.find((section) => section.expanded);
      for (const section of sections) if (section !== keep) section.expanded = false;
    }
    for (const [index, item] of [...this.#root.children].entries()) {
      const expanded = sections[index]?.expanded ?? false;
      item.querySelector('[role="heading"]').setAttribute("aria-level", this.headingLevel);
      item.querySelector('[part="trigger"]').setAttribute("aria-expanded", String(expanded));
      item.querySelector('[part="panel"]').hidden = !expanded;
    }
  }
  #toggle(index) {
    const section = this.#sections()[index];
    if (!section) return;
    const changed = [section];
    if (!section.expanded && this.exclusive) {
      changed.unshift(...this.#sections().filter((other) => other.expanded));
    }
    section.expanded = !section.expanded;
    this.#sync(section.expanded ? section : undefined);
    // Drop the mutation records this change made, so the observer does not sync again.
    this.#observer.takeRecords();
    for (const changedSection of changed) {
      this.dispatchEvent(
        new CustomEvent("toggle", { bubbles: true, detail: { section: changedSection } }),
      );
    }
  }
}

/**
 * Registers the accordion under `tagName` and its sections under `sectionTagName`. The accordion
 * finds its sections by class, so either can be an alias.
 */
export function defineAccordion(tagName = "ds-accordion", sectionTagName = "ds-accordion-section") {
  defineSection(sectionTagName);
  defineAccordionElement(tagName);
}
const defineSection = defineElement("ds-accordion-section", DsAccordionSection);
const defineAccordionElement = defineElement("ds-accordion", DsAccordion);
