/**
 * <ds-alert> — a status message in the flow of the page.
 *
 * Only the title and message sit inside the live region, so actions and the
 * dismiss control are never read as part of an announcement. With announce
 * off there is no live region at all.
 */

// Generated from src/alert.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/alert.styles.js";
import { Base, defineElement, lazyStyleSheet } from "./internal/element.js";
import { containsComposed, deepestFocus, tabbablesAround } from "./internal/focus.js";

const styleSheet = lazyStyleSheet(styles);
const VARIANTS = new Set(["info", "success", "warning", "danger"]);
const LIVE_ROLES = { polite: "status", urgent: "alert" };
const DISMISS_GRAPHIC = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
</svg>`;

export class DsAlert extends Base {
  static observedAttributes = ["label", "announce", "dismissible", "dismiss-label", "hidden"];
  #text;
  #content;
  #title;
  #icon;
  #actions;
  #dismiss;
  #focused = false;

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<div class="surface" part="surface">
      <div class="icon" part="icon" hidden><slot name="icon"></slot></div>
      <div class="body">
        <div class="text">
          <div class="content">
            <div class="title" part="title" hidden></div>
            <div class="message" part="message"><slot></slot></div>
          </div>
        </div>
        <div class="actions" part="actions" hidden><slot name="actions"></slot></div>
      </div>
      <button class="dismiss" part="dismiss" type="button" hidden>${DISMISS_GRAPHIC}</button>
    </div>`;
    this.#text = root.querySelector(".text");
    this.#content = root.querySelector(".content");
    this.#title = root.querySelector(".title");
    this.#icon = root.querySelector(".icon");
    this.#actions = root.querySelector(".actions");
    this.#dismiss = root.querySelector(".dismiss");

    for (const [container, name] of [
      [this.#icon, "icon"],
      [this.#actions, "actions"],
    ]) {
      const slot = container.querySelector(`slot[name="${name}"]`);
      slot.addEventListener("slotchange", () => {
        container.hidden = slot.assignedNodes({ flatten: true }).length === 0;
      });
    }
    this.#dismiss.addEventListener("click", () => this.#requestDismiss());
    this.addEventListener("focusin", () => (this.#focused = true));
    this.addEventListener("focusout", (event) => {
      if (containsComposed(this, event.relatedTarget)) return;
      if (this.hidden && !event.relatedTarget) this.#releaseFocus();
      this.#focused = false;
    });
  }

  connectedCallback() {
    this.#sync();
    this.#reveal();
  }

  attributeChangedCallback(name, previous, next) {
    if (name === "hidden") {
      if (next !== null && previous === null) this.#releaseFocus();
      if (next === null && previous !== null) this.#reveal();
      return;
    }
    this.#sync();
    if (name === "announce") this.#reveal();
  }

  get variant() {
    const variant = this.getAttribute("variant");
    return VARIANTS.has(variant) ? variant : "info";
  }

  set variant(value) {
    this.setAttribute("variant", value);
  }

  get label() {
    return this.getAttribute("label") ?? "";
  }

  set label(value) {
    this.setAttribute("label", value);
  }

  get announce() {
    const announce = this.getAttribute("announce");
    return announce in LIVE_ROLES ? announce : "off";
  }

  set announce(value) {
    this.setAttribute("announce", value);
  }

  get dismissible() {
    return this.hasAttribute("dismissible");
  }

  set dismissible(value) {
    this.toggleAttribute("dismissible", Boolean(value));
  }

  get dismissLabel() {
    return this.getAttribute("dismiss-label") || "Dismiss";
  }

  set dismissLabel(value) {
    this.setAttribute("dismiss-label", value);
  }

  #sync() {
    this.#title.textContent = this.label;
    this.#title.hidden = !this.label;
    this.#dismiss.hidden = !this.dismissible;
    this.#dismiss.setAttribute("aria-label", this.dismissLabel);

    const role = LIVE_ROLES[this.announce];
    if (role) this.#text.setAttribute("role", role);
    else this.#text.removeAttribute("role");
  }

  /**
   * A live region reliably announces text that appears inside it, not a
   * region that arrives with its text already in place. So when the alert
   * appears as a live region, its text is added a frame after the region.
   */
  #reveal() {
    if (this.announce === "off" || !this.isConnected) return;
    this.#content.hidden = true;
    requestAnimationFrame(() => {
      this.#content.hidden = false;
    });
  }

  #requestDismiss() {
    const proceed = this.dispatchEvent(
      new Event("dismiss", { cancelable: true, bubbles: true, composed: true }),
    );
    if (proceed) this.hidden = true;
  }

  /**
   * Hiding the focused alert drops focus to the page, so move it to a neighbor.
   * Chrome reports that drop as a focusout when the focus was in the shadow
   * root, and not at all when it was on slotted content, so focusin and
   * focusout track whether focus is inside and the hidden change acts on it.
   * Focus that a dismiss handler moved elsewhere stays where it went.
   */
  #releaseFocus() {
    if (!this.#focused) return;
    this.#focused = false;
    const active = deepestFocus(this.ownerDocument);
    if (active && active !== this.ownerDocument.body && !containsComposed(this, active)) return;
    const { before, after } = tabbablesAround(this);
    (after[0] ?? before.at(-1))?.focus();
  }
}

/** Register the element. Safe to call more than once. Defaults to "ds-alert". */
export const defineAlert = defineElement("ds-alert", DsAlert);
