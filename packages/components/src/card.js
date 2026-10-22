/**
 * <ds-card> — Use Card to present one subject as a bounded summary, such as an item in a collection, that a person can scan and act on.
 *
 * Behavior is in the spec: `pnpm spec get component.card`.
 *
 * The destination is a native anchor in the title, stretched over the surface
 * by CSS, so middle-click, modifier keys, and the context menu work without
 * script. Actions sit above the stretched target.
 */

// Generated from src/card.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/card.styles.js";
import {
  Base,
  ForwardsFocus,
  defineElement,
  focusTarget,
  lazyStyleSheet,
} from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);
const DEFAULT_LEVEL = 3;

export class DsCard extends ForwardsFocus(Base) {
  static observedAttributes = ["label", "href", "heading-level"];

  #title;
  #anchor;

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `
      <div class="surface" part="surface">
        <div class="media" part="media" hidden><slot name="media"></slot></div>
        <div class="title" part="title" role="heading" aria-level="${DEFAULT_LEVEL}"><a class="link" part="title-link"></a></div>
        <div class="body" part="body" hidden><slot></slot></div>
        <div class="actions" part="actions" hidden><slot name="actions"></slot></div>
      </div>`;

    this.#title = root.querySelector(".title");
    this.#anchor = root.querySelector("a");

    // Empty optional parts take no space.
    for (const slot of root.querySelectorAll("slot")) {
      slot.addEventListener("slotchange", () => {
        slot.parentElement.hidden = !slot
          .assignedNodes({ flatten: true })
          .some((node) => node.nodeType === Node.ELEMENT_NODE || node.textContent.trim());
      });
    }
  }

  attributeChangedCallback(name, _old, value) {
    if (name === "label") this.#anchor.textContent = value ?? "";
    // An anchor without href has no link role and is not focusable
    // (component.card#no-destination-no-link).
    if (name === "href") {
      if (value === null) this.#anchor.removeAttribute("href");
      else this.#anchor.setAttribute("href", value);
    }
    if (name === "heading-level") this.#title.setAttribute("aria-level", String(this.headingLevel));
  }

  get [focusTarget]() {
    return this.#anchor;
  }

  /** Follow the destination, as a native <a>.click() would. */
  click() {
    this.#anchor.click();
  }

  get label() {
    return this.getAttribute("label") ?? "";
  }

  set label(value) {
    this.setAttribute("label", value);
  }

  get href() {
    return this.getAttribute("href") ?? "";
  }

  set href(value) {
    this.setAttribute("href", value);
  }

  get headingLevel() {
    const level = Number(this.getAttribute("heading-level"));
    return Number.isInteger(level) && level >= 2 && level <= 6 ? level : DEFAULT_LEVEL;
  }

  set headingLevel(value) {
    this.setAttribute("heading-level", value);
  }
}

/** Register the element. Safe to call more than once. Defaults to "ds-card". */
export const defineCard = defineElement("ds-card", DsCard);
