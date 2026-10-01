/**
 * <ds-icon> — sizes and colors a graphic the consumer supplies.
 *
 * The icon ships no artwork: slot an inline <svg>. It is decorative and hidden
 * from assistive technology unless it has a label, in which case it is a named
 * image. Both are set through ElementInternals, so the host never sprouts role
 * or aria-* attributes of its own.
 */

// Generated from src/icon.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/icon.styles.js";
import { Base, defineElement, lazyStyleSheet } from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);
const SIZES = new Set(["inherit", "small", "medium", "large"]);

export class DsIcon extends Base {
  static observedAttributes = ["label"];

  #internals;

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<span class="icon" part="icon"><slot></slot></span>`;

    this.#internals = this.attachInternals();
    this.#syncSemantics();
  }

  attributeChangedCallback() {
    this.#syncSemantics();
  }

  #syncSemantics() {
    const label = this.label;
    this.#internals.role = label ? "img" : null;
    this.#internals.ariaLabel = label || null;
    this.#internals.ariaHidden = label ? null : "true";
  }

  get label() {
    return this.getAttribute("label") ?? "";
  }

  set label(value) {
    this.setAttribute("label", value);
  }

  get size() {
    const size = this.getAttribute("size");
    return SIZES.has(size) ? size : "inherit";
  }

  set size(value) {
    this.setAttribute("size", value);
  }
}

/** Register the element. Safe to call more than once. Defaults to "ds-icon". */
export const defineIcon = defineElement("ds-icon", DsIcon);
