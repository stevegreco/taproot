/**
 * <ds-progress-bar> — Use Progress bar to show how much of a task is done when you can measure it, such as an upload or a multi-step setup.
 *
 * A determinate progress indicator with a visible label. Its role, name, and
 * range are set through ElementInternals, so the host never sprouts role or
 * aria-* attributes of its own. Behavior is in the spec:
 * `pnpm spec get component.progress-bar`.
 */

// Generated from src/progress-bar.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/progress-bar.styles.js";
import { Base, defineElement, lazyStyleSheet } from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);
const DEFAULT_MAX = 100;

export class DsProgressBar extends Base {
  static observedAttributes = ["label", "value", "max"];

  #internals;
  #label;
  #fill;

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `
      <span class="label" part="label"></span>
      <span class="track" part="track"><span class="fill" part="fill"></span></span>
    `;
    this.#label = root.querySelector(".label");
    this.#fill = root.querySelector(".fill");

    this.#internals = this.attachInternals();
    this.#internals.role = "progressbar";
    this.#internals.ariaValueMin = "0";
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    const { label, value, max } = this;
    this.#label.textContent = label;
    this.#internals.ariaLabel = label;
    this.#internals.ariaValueNow = String(value);
    this.#internals.ariaValueMax = String(max);
    this.#fill.style.setProperty("--_fraction", String(value / max));
  }

  get label() {
    return this.getAttribute("label") ?? "";
  }

  set label(value) {
    this.setAttribute("label", value);
  }

  /** How much is done, clamped to 0 through max. */
  get value() {
    const value = Number(this.getAttribute("value"));
    return Number.isFinite(value) ? Math.min(Math.max(value, 0), this.max) : 0;
  }

  set value(value) {
    this.setAttribute("value", value);
  }

  /** The amount that means done. Missing, zero, negative, or not a number reads as 100. */
  get max() {
    const max = Number(this.getAttribute("max"));
    return this.hasAttribute("max") && Number.isFinite(max) && max > 0 ? max : DEFAULT_MAX;
  }

  set max(value) {
    this.setAttribute("max", value);
  }
}

/** Register the element. Safe to call more than once. Defaults to "ds-progress-bar". */
export const defineProgressBar = defineElement("ds-progress-bar", DsProgressBar);
