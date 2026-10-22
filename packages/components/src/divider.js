/**
 * <ds-divider> — Use Divider to separate groups of related content within one surface or region with a thin line.
 *
 * A separator with no content and no name. Its role and orientation are set
 * through ElementInternals, so the host never sprouts role or aria-* attributes
 * of its own. Behavior is in the spec: `pnpm spec get component.divider`.
 */

// Generated from src/divider.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/divider.styles.js";
import { Base, defineElement, lazyStyleSheet } from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);
const ORIENTATION_VALUES = new Set(["horizontal", "vertical"]);

export class DsDivider extends Base {
  static observedAttributes = ["orientation"];

  #internals;

  constructor() {
    super();

    // No slot: anything placed inside the divider is not rendered.
    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<span class="line" part="line"></span>`;

    this.#internals = this.attachInternals();
    this.#internals.role = "separator";
    this.#syncOrientation();
  }

  attributeChangedCallback() {
    this.#syncOrientation();
  }

  #syncOrientation() {
    this.#internals.ariaOrientation = this.orientation;
  }

  get orientation() {
    const value = this.getAttribute("orientation");
    return ORIENTATION_VALUES.has(value) ? value : "horizontal";
  }

  set orientation(value) {
    this.setAttribute("orientation", value);
  }
}

/** Register the element. Safe to call more than once. Defaults to "ds-divider". */
export const defineDivider = defineElement("ds-divider", DsDivider);
