/**
 * <ds-select> — a token-driven single-choice select.
 *
 * The label, hint, and error live in the shadow root so their association does
 * not depend on light-DOM ids. The element is form-associated: name and value
 * participate in submit and reset across the shadow boundary.
 */

// Generated from src/select.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/select.styles.js";
import {
  Base,
  ForwardsFocus,
  defineElement,
  focusTarget,
  lazyStyleSheet,
} from "./internal/element.js";

const VALIDITY_FLAGS = [
  "badInput",
  "patternMismatch",
  "rangeOverflow",
  "rangeUnderflow",
  "stepMismatch",
  "tooLong",
  "tooShort",
  "typeMismatch",
  "valueMissing",
];

const styleSheet = lazyStyleSheet(styles);

export class DsSelect extends ForwardsFocus(Base) {
  /** Lets ElementInternals submit the value across the shadow boundary. */
  static formAssociated = true;

  static observedAttributes = ["disabled", "error", "hint", "label", "name", "required", "value"];

  #internals;
  #field;
  #label;
  #labelText;
  #requiredMark;
  #input;
  #hint;
  #error;
  #formDisabled = false;
  #dirty = false;
  #observer;
  #pendingValue;

  constructor() {
    super();
    this.#internals = this.attachInternals();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `
      <div class="field" part="field">
        <label class="label" part="label" for="control">
          <span class="label-text"></span>
          <span class="required" hidden aria-hidden="true">*</span>
        </label>
        <select id="control" class="control" part="control"></select>
        <p id="hint" class="hint" part="hint" hidden></p>
        <p id="error" class="error" part="error" hidden aria-live="polite"></p>
      </div>
    `;

    this.#field = root.querySelector(".field");
    this.#label = root.querySelector("label");
    this.#labelText = root.querySelector(".label-text");
    this.#requiredMark = root.querySelector(".required");
    this.#input = root.querySelector("select");
    this.#hint = root.querySelector("#hint");
    this.#error = root.querySelector("#error");

    this.#input.addEventListener("input", this.#onInput);
    this.#input.addEventListener("change", this.#onChange);
    this.#input.addEventListener("invalid", this.#onInvalid);
    this.addEventListener("invalid", this.#onInvalid);

    this.#render();
    this.#syncDisabled();
    this.#syncFormValue();
    this.#syncValidity();
  }

  connectedCallback() {
    this.#observer ??= new MutationObserver(() => this.#syncOptions());
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    this.#syncOptions();
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
  }

  #syncOptions(reset = false) {
    const current = reset
      ? null
      : (this.#pendingValue ?? (this.#input.options.length ? this.#input.value : null));
    const choices = [...this.children].filter(
      (child) => child.localName === "option" || child.localName === "optgroup",
    );
    this.#input.replaceChildren(...choices.map((choice) => choice.cloneNode(true)));
    if (current != null && [...this.#input.options].some((option) => option.value === current)) {
      this.#input.value = current;
      this.#pendingValue = undefined;
    } else if (!this.#dirty && this.hasAttribute("value")) {
      this.#input.value = this.getAttribute("value");
    }
    if (this.#input.options.length) this.#pendingValue = undefined;
    this.#syncFormValue();
    this.#syncValidity();
  }

  attributeChangedCallback(name, _old, value) {
    if (!this.#input) return;

    if (name === "value") {
      if (!this.#dirty) {
        this.#pendingValue = value ?? "";
        this.#input.value = value ?? "";
        this.#syncFormValue();
      }
      this.#syncValidity();
      return;
    }

    this.#render();
    if (name === "disabled") this.#syncDisabled();
    this.#syncFormValue();
    this.#syncValidity();
  }

  /** Mirrors disabled state inherited from an ancestor <fieldset>. */
  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#syncDisabled();
  }

  formResetCallback() {
    this.#dirty = false;
    this.#pendingValue = undefined;
    this.#syncOptions(true);
    this.#syncFormValue();
    this.#syncValidity();
  }

  formStateRestoreCallback(state, mode) {
    if (typeof state !== "string") return;
    this.#pendingValue = state;
    this.#input.value = state;
    this.#dirty = mode === "restore";
    this.#syncFormValue();
    this.#syncValidity();
  }

  get [focusTarget]() {
    return this.#input;
  }

  /** The <form> this field belongs to, or null. */
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

  get required() {
    return this.hasAttribute("required");
  }

  set required(value) {
    this.toggleAttribute("required", Boolean(value));
  }

  get value() {
    return this.#input ? this.#input.value : (this.getAttribute("value") ?? "");
  }

  set value(next) {
    const text = next == null ? "" : String(next);
    this.#dirty = true;
    if (!this.#input) return;
    this.#pendingValue = text;
    this.#input.value = text;
    this.#syncFormValue();
    this.#syncValidity();
  }

  #setOptionalAttribute(name, value) {
    if (value == null || value === "") this.removeAttribute(name);
    else this.setAttribute(name, value);
  }

  #render() {
    const label = this.label;
    this.#labelText.textContent = label;
    this.#label.hidden = label.length === 0;

    const hint = this.hint;
    this.#hint.textContent = hint;
    this.#hint.hidden = hint.length === 0;

    const error = this.error;
    this.#error.textContent = error;
    this.#error.hidden = error.length === 0;

    this.#requiredMark.hidden = !this.required;
    this.#input.required = this.required;
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
    this.#syncFormValue();
    this.#syncValidity();
  }

  #syncFormValue() {
    if (this.disabled || this.#formDisabled) {
      this.#internals.setFormValue(null);
      return;
    }
    const option = this.#input.selectedOptions[0];
    const unavailable =
      !option ||
      option.disabled ||
      (option.parentElement.localName === "optgroup" && option.parentElement.disabled);
    this.#internals.setFormValue(unavailable ? null : this.#input.value);
  }

  #syncValidity() {
    const input = this.#input;
    const error = this.error;
    if (error) {
      this.#internals.setValidity({ customError: true }, error, input);
      return;
    }
    if (input.validity.valid) {
      this.#internals.setValidity({});
      return;
    }
    const flags = {};
    for (const flag of VALIDITY_FLAGS) {
      if (input.validity[flag]) flags[flag] = true;
    }
    this.#internals.setValidity(flags, input.validationMessage, input);
  }

  #onInput = () => {
    this.#dirty = true;
    this.#pendingValue = undefined;
    this.#syncFormValue();
    this.#syncValidity();
  };

  /**
   * The native input's `input` event is composed and reaches the host on its
   * own; `change` is not, so re-dispatch it from the host.
   */
  #onChange = () => {
    this.#dirty = true;
    this.#pendingValue = undefined;
    this.#syncFormValue();
    this.#syncValidity();
    this.dispatchEvent(new Event("change", { bubbles: true }));
  };

  /** Keep the visible error as the only validation message when one is set. */
  #onInvalid = (event) => {
    if (this.error) event.preventDefault();
  };
}

/** Register the element. Safe to call more than once. Defaults to "ds-select". */
export const defineSelect = defineElement("ds-select", DsSelect);
