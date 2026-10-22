/**
 * <ds-button> — a token-driven button web component.
 *
 * Every visual value comes from the CSS custom properties published by
 * @stevegreco/design-system. Custom properties are inherited, so they cross the
 * shadow boundary on their own: load `tokens.css` once on the page and the
 * button (including its dark theme) follows automatically.
 */

// Generated from src/button.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/button.styles.js";
import {
  Base,
  ForwardsFocus,
  defineElement,
  focusTarget,
  lazyStyleSheet,
} from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);
const VARIANTS = new Set(["primary", "secondary", "tertiary", "destructive"]);

export class DsButton extends ForwardsFocus(Base) {
  /** Lets ElementInternals find the containing <form> across the shadow boundary. */
  static formAssociated = true;

  static observedAttributes = ["disabled", "aria-label"];

  #internals;
  #button;
  #formDisabled = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    // The inner control is always type="button" (a bare <button> defaults to
    // "submit"); #onClick drives real form behaviour instead.
    root.innerHTML = `<button class="button" part="button" type="button"><slot></slot></button>`;

    this.#button = root.querySelector("button");
    this.addEventListener("click", this.#onClick);
  }

  attributeChangedCallback(name, _old, value) {
    if (name === "disabled") {
      this.#syncDisabled();
    } else if (name === "aria-label") {
      if (value === null) this.#button.removeAttribute("aria-label");
      else this.#button.setAttribute("aria-label", value);
    }
  }

  /** Mirrors disabled state inherited from an ancestor <fieldset>. */
  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#syncDisabled();
  }

  get [focusTarget]() {
    return this.#button;
  }

  /** The <form> this button belongs to, or null. */
  get form() {
    return this.#internals.form;
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  get type() {
    const type = this.getAttribute("type");
    return type === "submit" || type === "reset" ? type : "button";
  }

  set type(value) {
    this.setAttribute("type", value);
  }

  get variant() {
    const variant = this.getAttribute("variant");
    return VARIANTS.has(variant) ? variant : "primary";
  }

  set variant(value) {
    this.setAttribute("variant", value);
  }

  get size() {
    return this.getAttribute("size") === "small" ? "small" : "medium";
  }

  set size(value) {
    this.setAttribute("size", value);
  }

  #syncDisabled() {
    this.#button.disabled = this.disabled || this.#formDisabled;
  }

  #onClick = (event) => {
    if (this.disabled || this.#formDisabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    // Forms do not cross shadow boundaries, so submit/reset are driven manually.
    const form = this.#internals.form;
    if (!form) return;

    if (this.type === "submit") form.requestSubmit();
    else if (this.type === "reset") form.reset();
  };
}

/** Register the element. Safe to call more than once. Defaults to "ds-button". */
export const defineButton = defineElement("ds-button", DsButton);
