import { styles } from "../dist/radio-group.styles.js";
import {
  Base,
  ForwardsFocus,
  defineElement,
  focusTarget,
  lazyStyleSheet,
} from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);

/** One native radio group with form association and group-owned messages. */
export class DsRadioGroup extends ForwardsFocus(Base) {
  static formAssociated = true;
  static observedAttributes = ["label", "hint", "error", "name", "value", "disabled", "required"];
  #internals;
  #options;
  #value = "";
  #dirty = false;
  #formDisabled = false;
  #observer;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<div class="field" part="field">
      <div id="label" class="label" part="label"></div>
      <div class="options" part="options" role="radiogroup" aria-labelledby="label"></div>
      <p id="hint" class="hint" part="hint" hidden></p>
      <p id="error" class="error" part="error" hidden aria-live="polite"></p>
    </div>`;
    this.#options = root.querySelector(".options");
    this.#options.addEventListener("change", (event) => {
      this.#dirty = true;
      this.#value = event.target.value;
      this.#sync();
      this.dispatchEvent(new Event("change", { bubbles: true }));
    });
    this.#options.addEventListener("input", (event) => {
      this.#dirty = true;
      this.#value = event.target.value;
      this.#sync();
    });
    this.addEventListener("invalid", (event) => {
      if (this.error) event.preventDefault();
    });
    this.#observer = new MutationObserver((records) => {
      if (records.some((record) => record.type === "childList" || record.target !== this))
        this.#renderOptions();
    });
  }

  connectedCallback() {
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    if (!this.#dirty) this.#value = this.getAttribute("value") ?? "";
    this.#renderOptions();
  }
  disconnectedCallback() {
    this.#observer.disconnect();
  }
  attributeChangedCallback(name) {
    if (name === "value" && !this.#dirty) this.#value = this.getAttribute("value") ?? "";
    if (this.#options) this.#sync();
  }
  get [focusTarget]() {
    return (
      this.#options.querySelector("input:checked:not(:disabled)") ??
      this.#options.querySelector("input:not(:disabled)")
    );
  }
  focus(options) {
    this[focusTarget]?.focus(options);
  }
  blur() {
    this.shadowRoot.activeElement?.blur();
  }
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
    this.#setOptional("hint", value);
  }
  get error() {
    return this.getAttribute("error") ?? "";
  }
  set error(value) {
    this.#setOptional("error", value);
  }
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(value) {
    this.#setOptional("name", value);
  }
  get value() {
    return this.#value;
  }
  set value(value) {
    this.#dirty = true;
    this.#value = value == null ? "" : String(value);
    this.#sync();
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
  formDisabledCallback(value) {
    this.#formDisabled = value;
    this.#sync();
  }
  formResetCallback() {
    this.#dirty = false;
    this.#value = this.getAttribute("value") ?? "";
    this.#sync();
  }
  formStateRestoreCallback(state) {
    if (typeof state === "string") {
      this.#dirty = true;
      this.#value = state;
      this.#sync();
    }
  }
  #setOptional(name, value) {
    if (value == null || value === "") this.removeAttribute(name);
    else this.setAttribute(name, value);
  }
  #renderOptions() {
    const focusedValue = this.shadowRoot.activeElement?.value;
    this.#options.replaceChildren();
    for (const [index, option] of [...this.querySelectorAll(":scope > option")].entries()) {
      const choice = document.createElement("label");
      choice.className = "choice";
      choice.setAttribute("part", "choice");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "choice";
      input.id = `option-${index}`;
      input.value = option.value;
      input.className = "control";
      input.setAttribute("part", "control");
      input.dataset.disabled = String(option.disabled);
      const box = document.createElement("span");
      box.className = "box";
      const indicator = document.createElement("span");
      indicator.className = "indicator";
      indicator.setAttribute("part", "indicator");
      indicator.setAttribute("aria-hidden", "true");
      box.append(input, indicator);
      const text = document.createElement("span");
      text.className = "option-label";
      text.setAttribute("part", "option-label");
      text.textContent = option.label;
      choice.append(box, text);
      this.#options.append(choice);
    }
    this.#sync();
    if (focusedValue !== undefined) {
      const replacement = [...this.#options.querySelectorAll("input")].find(
        (input) => input.value === focusedValue && !input.disabled,
      );
      (replacement ?? this[focusTarget])?.focus();
    }
  }
  #sync() {
    const disabled = this.disabled || this.#formDisabled;
    const root = this.shadowRoot;
    root.querySelector(".field").classList.toggle("is-disabled", disabled);
    root.querySelector("#label").textContent = this.label + (this.required ? " *" : "");
    this.#options.setAttribute("aria-required", String(this.required));
    this.#options.setAttribute("aria-disabled", String(disabled));
    this.#options.setAttribute("aria-invalid", String(Boolean(this.error)));
    const messages = [];
    for (const name of ["hint", "error"]) {
      const node = root.querySelector(`#${name}`);
      node.textContent = this[name];
      node.hidden = !this[name];
      if (this[name]) messages.push(name);
    }
    this.#options.setAttribute("aria-describedby", messages.join(" "));
    let selected;
    for (const input of this.#options.querySelectorAll("input")) {
      input.disabled = disabled || input.dataset.disabled === "true";
      input.required = this.required;
      input.checked = Boolean(this.#value) && input.value === this.#value && !selected;
      input.setAttribute("aria-describedby", messages.join(" "));
      input.setAttribute("aria-invalid", String(Boolean(this.error)));
      input.closest(".choice").classList.toggle("is-disabled", input.disabled);
      if (input.checked) selected = input;
    }
    this.#internals.setFormValue(
      selected && !selected.disabled ? selected.value : null,
      this.#value,
    );
    const anchor = this[focusTarget];
    if (disabled) this.#internals.setValidity({});
    else if (this.error)
      this.#internals.setValidity({ customError: true }, this.error, anchor ?? undefined);
    else if (this.required && (!selected || selected.disabled))
      this.#internals.setValidity({ valueMissing: true }, "Choose an option.", anchor ?? undefined);
    else this.#internals.setValidity({});
  }
}
export const defineRadioGroup = defineElement("ds-radio-group", DsRadioGroup);
