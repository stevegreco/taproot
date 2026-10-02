// Generated from src/switch.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/switch.styles.js";
import {
  Base,
  ForwardsFocus,
  defineElement,
  focusTarget,
  lazyStyleSheet,
} from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);

export class DsSwitch extends ForwardsFocus(Base) {
  /** Lets ElementInternals submit the value across the shadow boundary. */
  static formAssociated = true;

  static observedAttributes = ["checked", "disabled", "error", "hint", "label", "name", "value"];

  #internals;
  #field;
  #label;
  #labelText;
  #input;
  #hint;
  #error;
  #formDisabled = false;
  /** Like a native checkbox's dirty checkedness: once set, the attribute no longer drives state. */
  #dirty = false;

  constructor() {
    super();
    this.#internals = this.attachInternals();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `
      <div class="field" part="field">
        <div class="choice" part="choice">
          <span class="box">
            <input id="control" class="control" part="control" type="checkbox" role="switch" />
            <span class="indicator" part="indicator" aria-hidden="true"></span>
          </span>
          <label class="label" part="label" for="control">
            <span class="label-text"></span>
          </label>
        </div>
        <p id="hint" class="hint" part="hint" hidden></p>
        <p id="error" class="error" part="error" hidden aria-live="polite"></p>
      </div>
    `;

    this.#field = root.querySelector(".field");
    this.#label = root.querySelector("label");
    this.#labelText = root.querySelector(".label-text");
    this.#input = root.querySelector("input");
    this.#hint = root.querySelector("#hint");
    this.#error = root.querySelector("#error");

    this.#input.addEventListener("input", () => {
      this.#dirty = true;
      this.#syncFormValue();
      this.#syncValidity();
    });
    this.#input.addEventListener("change", this.#onChange);
    this.#input.addEventListener("invalid", this.#onInvalid);
    this.addEventListener("invalid", this.#onInvalid);

    this.#input.checked = this.hasAttribute("checked");
    this.#render();
    this.#syncDisabled();
    this.#syncFormValue();
    this.#syncValidity();
  }

  attributeChangedCallback(name, _old, value) {
    if (!this.#input) return;

    if (name === "checked") {
      if (!this.#dirty) this.#input.checked = value != null;
    } else {
      this.#render();
      if (name === "disabled") this.#syncDisabled();
    }
    this.#syncFormValue();
    this.#syncValidity();
  }

  /** Mirrors disabled state inherited from an ancestor <fieldset>. */
  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#syncDisabled();
    this.#syncFormValue();
  }

  formResetCallback() {
    this.#dirty = false;
    this.#input.checked = this.hasAttribute("checked");
    this.#syncFormValue();
    this.#syncValidity();
  }

  formStateRestoreCallback(state, mode) {
    if (state !== "checked" && state !== "unchecked") return;
    this.#input.checked = state === "checked";
    this.#dirty = mode === "restore";
    this.#syncFormValue();
    this.#syncValidity();
  }

  get [focusTarget]() {
    return this.#input;
  }

  /** The <form> this switch belongs to, or null. */
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

  /** Submitted when checked. Defaults to "on", as for a native checkbox. */
  get value() {
    return this.getAttribute("value") ?? "on";
  }

  set value(value) {
    this.#setOptionalAttribute("value", value);
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }

  set disabled(value) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  /** Live checked state. The attribute sets the initial state. */
  get checked() {
    return this.#input ? this.#input.checked : this.hasAttribute("checked");
  }

  set checked(next) {
    this.#dirty = true;
    if (!this.#input) return;
    this.#input.checked = Boolean(next);
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

    this.#input.value = this.value;

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
  }

  #syncFormValue() {
    const checked = this.#input.checked;
    const state = checked ? "checked" : "unchecked";
    if (!checked || this.disabled || this.#formDisabled) {
      this.#internals.setFormValue(null, state);
      return;
    }
    this.#internals.setFormValue(this.value, state);
  }

  #syncValidity() {
    const input = this.#input;
    const error = this.error;
    if (error) {
      this.#internals.setValidity({ customError: true }, error, input);
      return;
    }
    this.#internals.setValidity({});
  }

  /** Native input crosses the shadow boundary; change is forwarded explicitly. */
  #onChange = () => {
    this.#dirty = true;
    this.#syncFormValue();
    this.#syncValidity();
    this.dispatchEvent(new Event("change", { bubbles: true }));
  };

  /** Keep the visible error as the only validation message when one is set. */
  #onInvalid = (event) => {
    if (this.error) event.preventDefault();
  };
}

/** Register the element. Safe to call more than once. Defaults to "ds-switch". */
export const defineSwitch = defineElement("ds-switch", DsSwitch);
