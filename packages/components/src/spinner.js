/**
 * <ds-spinner> — Use Spinner to show that something is loading or working when you cannot say how long it will take.
 *
 * An indeterminate progress indicator with no visible text. Its role and name
 * are set through ElementInternals, so the host never sprouts role or aria-*
 * attributes of its own. Behavior is in the spec: `pnpm spec get component.spinner`.
 */

// Generated from src/spinner.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/spinner.styles.js";
import { Base, defineElement, lazyStyleSheet } from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);
const SIZE_VALUES = new Set(["inherit", "small", "medium", "large"]);
const DEFAULT_LABEL = "Loading";

export class DsSpinner extends Base {
  static observedAttributes = ["label"];

  #internals;

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<span class="indicator" part="indicator"></span>`;

    this.#internals = this.attachInternals();
    this.#internals.role = "progressbar";
    this.#syncName();
  }

  attributeChangedCallback() {
    this.#syncName();
  }

  #syncName() {
    this.#internals.ariaLabel = this.label;
  }

  get label() {
    return this.getAttribute("label") || DEFAULT_LABEL;
  }

  set label(value) {
    this.setAttribute("label", value);
  }

  get size() {
    const value = this.getAttribute("size");
    return SIZE_VALUES.has(value) ? value : "inherit";
  }

  set size(value) {
    this.setAttribute("size", value);
  }
}

/** Register the element. Safe to call more than once. Defaults to "ds-spinner". */
export const defineSpinner = defineElement("ds-spinner", DsSpinner);
