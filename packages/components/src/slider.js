/**
 * <ds-slider> — a token-driven slider with a label, value text, hint, and error.
 *
 * The inner control is a native range input laid over the drawn track, fill,
 * and thumb with no opacity, so role, value, pointer dragging, and track
 * presses stay native. Keys are handled here, so each one moves by the amounts
 * the spec sets and reports input then change. The element is form-associated:
 * the number submits under its name, and reset restores the `value` attribute.
 *
 * Behavior is in the spec: `pnpm spec get component.slider`.
 */

// Generated from src/slider.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/slider.styles.js";
import {
  Base,
  ForwardsFocus,
  defineElement,
  focusTarget,
  lazyStyleSheet,
} from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);

const defaults = { min: 0, max: 100, step: 1 };

function numberAttribute(element, name) {
  const parsed = Number.parseFloat(element.getAttribute(name) ?? "");
  return Number.isFinite(parsed) ? parsed : defaults[name];
}

export class DsSlider extends ForwardsFocus(Base) {
  /** Lets ElementInternals submit the value across the shadow boundary. */
  static formAssociated = true;

  static observedAttributes = [
    "disabled",
    "error",
    "hint",
    "label",
    "max",
    "min",
    "name",
    "step",
    "value",
  ];

  #internals;
  #field;
  #slider;
  #label;
  #valueText;
  #input;
  #hint;
  #error;
  #formDisabled = false;
  /** Once a person or a script sets the value, the attribute no longer drives it. */
  #dirty = false;
  /** The value when the pointer went down, or null when no drag is in progress. */
  #dragStart = null;

  constructor() {
    super();
    this.#internals = this.attachInternals();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `
      <div class="field" part="field">
        <div class="header" part="header">
          <label class="label" part="label" for="control"></label>
          <span class="value" part="value" aria-hidden="true"></span>
        </div>
        <div class="slider">
          <input id="control" class="control" part="control" type="range" />
          <div class="track" part="track"><div class="fill" part="fill"></div></div>
          <div class="thumb" part="thumb"></div>
        </div>
        <p id="hint" class="hint" part="hint" hidden></p>
        <p id="error" class="error" part="error" hidden aria-live="polite"></p>
      </div>
    `;

    this.#field = root.querySelector(".field");
    this.#slider = root.querySelector(".slider");
    this.#label = root.querySelector(".label");
    this.#valueText = root.querySelector(".value");
    this.#input = root.querySelector("input");
    this.#hint = root.querySelector("#hint");
    this.#error = root.querySelector("#error");

    this.#input.addEventListener("input", this.#onInput);
    // Change is reported from here, on release, so the native one stays inside.
    this.#input.addEventListener("change", (event) => event.stopPropagation());
    this.#input.addEventListener("keydown", this.#onKeyDown);
    this.#input.addEventListener("pointerdown", this.#onPointerDown);
    this.#input.addEventListener("invalid", this.#onInvalid);
    this.addEventListener("invalid", this.#onInvalid);

    this.#syncRange();
    this.#render();
    this.#syncDisabled();
  }

  attributeChangedCallback(name) {
    if (!this.#input) return;
    if (name === "min" || name === "max" || name === "step" || name === "value") {
      this.#syncRange();
    } else {
      this.#render();
      if (name === "disabled") this.#syncDisabled();
    }
    this.#syncValue();
  }

  /** Mirrors disabled state inherited from an ancestor <fieldset>. */
  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#syncDisabled();
  }

  formResetCallback() {
    this.#dirty = false;
    this.#syncRange();
    this.#syncValue();
  }

  formStateRestoreCallback(state) {
    if (typeof state !== "string" || state === "") return;
    this.#dirty = true;
    this.#input.value = state;
    this.#syncValue();
  }

  get [focusTarget]() {
    return this.#input;
  }

  /** The <form> this slider belongs to, or null. */
  get form() {
    return this.#internals.form;
  }

  get label() {
    return this.getAttribute("label") ?? "";
  }

  set label(value) {
    this.setAttribute("label", value ?? "");
  }

  get hint() {
    return this.getAttribute("hint") ?? "";
  }

  set hint(value) {
    this.#setOptionalAttribute("hint", value);
  }

  get error() {
    return this.getAttribute("error") ?? "";
  }

  set error(value) {
    this.#setOptionalAttribute("error", value);
  }

  /** The current value, always between min and max and on a step. The attribute sets the initial value. */
  get value() {
    return Number(this.#input.value);
  }

  set value(next) {
    this.#dirty = true;
    this.#input.value = String(Number(next));
    this.#syncValue();
  }

  get min() {
    return numberAttribute(this, "min");
  }

  set min(value) {
    this.setAttribute("min", String(value));
  }

  get max() {
    return numberAttribute(this, "max");
  }

  set max(value) {
    this.setAttribute("max", String(value));
  }

  get step() {
    return numberAttribute(this, "step");
  }

  set step(value) {
    this.setAttribute("step", String(value));
  }

  get name() {
    return this.getAttribute("name") ?? "";
  }

  set name(value) {
    this.#setOptionalAttribute("name", value);
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  #setOptionalAttribute(name, value) {
    if (value == null || value === "") this.removeAttribute(name);
    else this.setAttribute(name, value);
  }

  /** Pass min, max, and step to the native input, which keeps the value in range and on a step. */
  #syncRange() {
    const input = this.#input;
    const current = input.value;
    const step = this.step > 0 ? this.step : defaults.step;
    input.min = String(this.min);
    input.max = String(Math.max(this.max, this.min));
    input.step = String(step);
    input.value = this.#dirty ? current : (this.getAttribute("value") ?? String(this.min));
  }

  #render() {
    const label = this.label;
    this.#label.textContent = label;

    const hint = this.hint;
    this.#hint.textContent = hint;
    this.#hint.hidden = hint.length === 0;

    const error = this.error;
    this.#error.textContent = error;
    this.#error.hidden = error.length === 0;
    this.#field.classList.toggle("is-invalid", error.length > 0);

    const describedBy = [];
    if (hint) describedBy.push("hint");
    if (error) describedBy.push("error");
    if (describedBy.length > 0) this.#input.setAttribute("aria-describedby", describedBy.join(" "));
    else this.#input.removeAttribute("aria-describedby");

    if (error) this.#input.setAttribute("aria-invalid", "true");
    else this.#input.removeAttribute("aria-invalid");
  }

  #syncDisabled() {
    const disabled = this.disabled || this.#formDisabled;
    this.#input.disabled = disabled;
    this.#field.classList.toggle("is-disabled", disabled);
    // The value text belongs to the inactive control, which WCAG exempts from contrast. Saying so
    // lets checkers apply the exemption; assistive technology does not read this span.
    if (disabled) this.#valueText.setAttribute("aria-disabled", "true");
    else this.#valueText.removeAttribute("aria-disabled");
    this.#syncValue();
  }

  /** Draw the thumb and fill, show the value text, and update the form value and validity. */
  #syncValue() {
    const value = this.value;
    const min = Number(this.#input.min);
    const max = Number(this.#input.max);
    const ratio = max > min ? (value - min) / (max - min) : 0;
    this.#slider.style.setProperty("--ratio", String(ratio));

    const text = new Intl.NumberFormat(this.closest("[lang]")?.lang || undefined).format(value);
    this.#valueText.textContent = text;
    this.#input.setAttribute("aria-valuetext", text);

    const disabled = this.disabled || this.#formDisabled;
    this.#internals.setFormValue(disabled ? null : String(value), String(value));

    const error = this.error;
    if (error) this.#internals.setValidity({ customError: true }, error, this.#input);
    else this.#internals.setValidity({});
  }

  #onInput = () => {
    this.#dirty = true;
    this.#syncValue();
  };

  #onPointerDown = () => {
    this.#dragStart = this.value;
    this.#field.classList.add("is-dragging");
    addEventListener("pointerup", this.#onPointerUp);
    addEventListener("pointercancel", this.#onPointerUp);
  };

  #onPointerUp = () => {
    removeEventListener("pointerup", this.#onPointerUp);
    removeEventListener("pointercancel", this.#onPointerUp);
    this.#field.classList.remove("is-dragging");
    const start = this.#dragStart;
    this.#dragStart = null;
    if (start !== null && start !== this.value) this.#dispatchChange();
  };

  #onKeyDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const next = this.#valueForKey(event.key);
    if (next === null) return;
    event.preventDefault();
    const before = this.value;
    this.#input.value = String(next);
    if (this.value === before) return;
    this.#dirty = true;
    this.#syncValue();
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.#dispatchChange();
  };

  #valueForKey(key) {
    const step = Number(this.#input.step);
    const min = Number(this.#input.min);
    const max = Number(this.#input.max);
    const page = Math.max(step, Math.round((max - min) / 10 / step) * step);
    // Arrow keys follow the visual direction, so Right decreases in a right-to-left layout.
    const forward = getComputedStyle(this).direction === "rtl" ? -1 : 1;
    const value = this.value;
    switch (key) {
      case "ArrowRight":
        return value + step * forward;
      case "ArrowLeft":
        return value - step * forward;
      case "ArrowUp":
        return value + step;
      case "ArrowDown":
        return value - step;
      case "PageUp":
        return value + page;
      case "PageDown":
        return value - page;
      case "Home":
        return min;
      case "End":
        return max;
      default:
        return null;
    }
  }

  /** Not composed, like a native change event. */
  #dispatchChange() {
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /** Keep the visible error as the only validation message. */
  #onInvalid = (event) => {
    if (this.error) event.preventDefault();
  };
}

/** Register the element. Safe to call more than once. Defaults to "ds-slider". */
export const defineSlider = defineElement("ds-slider", DsSlider);
