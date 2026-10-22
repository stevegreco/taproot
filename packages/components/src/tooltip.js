/**
 * <ds-tooltip> — Use Tooltip to show the name of an icon-only control when a person points at it or focuses it.
 *
 * Wraps one control. The label becomes that control's `aria-label`, so the
 * bubble is only a visible copy of its name and is hidden from assistive
 * technology. The bubble is a manual popover in the top layer, placed with
 * fixed coordinates next to the trigger. Behavior is in the spec:
 * `pnpm spec get component.tooltip`.
 */

// Generated from src/tooltip.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/tooltip.styles.js";
import { Base, defineElement, lazyStyleSheet } from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);
const PLACEMENT_VALUES = new Set(["above", "below"]);

/** How long the pointer rests on the trigger before the bubble opens (component.tooltip#opens-on-hover-and-focus). */
const OPEN_DELAY = 300;
/** Bridges the gap between trigger and bubble (component.tooltip#stays-while-hovered). */
const CLOSE_DELAY = 100;

/** The open tooltip in each document (component.tooltip#one-open). */
const openTooltips = new WeakMap();

export class DsTooltip extends Base {
  static observedAttributes = ["label", "placement", "hidden"];

  #slot;
  #bubble;
  #trigger = null;
  /** The trigger's own aria-label, put back when it stops being the trigger. */
  #triggerLabel = null;
  #hovered = false;
  #focused = false;
  /** Set by Escape or activation; cleared when the pointer or focus leaves. */
  #dismissed = false;
  #timer;

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<span class="trigger" part="trigger"><slot></slot></span><span
      class="bubble" part="bubble" popover="manual" aria-hidden="true"></span>`;

    this.#slot = root.querySelector("slot");
    this.#bubble = root.querySelector(".bubble");
    this.#slot.addEventListener("slotchange", () => this.#syncTrigger());

    this.addEventListener("pointerenter", this.#onPointerEnter);
    this.addEventListener("pointerleave", this.#onPointerLeave);
    this.addEventListener("focusin", this.#onFocusIn);
    this.addEventListener("focusout", this.#onFocusOut);
    this.addEventListener("click", this.#onActivate);
  }

  connectedCallback() {
    this.#bubble.textContent = this.label;
    this.#syncTrigger();
  }

  disconnectedCallback() {
    this.#close();
    this.#setTrigger(null);
  }

  attributeChangedCallback(name) {
    if (name === "label") {
      this.#bubble.textContent = this.label;
      if (this.#trigger) this.#trigger.setAttribute("aria-label", this.label);
    } else if (name === "hidden" && this.hidden) {
      this.#close();
    } else if (this.#isOpen) {
      this.#position();
    }
  }

  get label() {
    return this.getAttribute("label") ?? "";
  }

  set label(value) {
    this.setAttribute("label", value);
  }

  get placement() {
    const value = this.getAttribute("placement");
    return PLACEMENT_VALUES.has(value) ? value : "above";
  }

  set placement(value) {
    this.setAttribute("placement", value);
  }

  get #isOpen() {
    return this.#bubble.matches(":popover-open");
  }

  /** The first slotted element is the one trigger (component.tooltip#one-trigger). */
  #syncTrigger() {
    if (!this.isConnected) return;
    this.#setTrigger(this.#slot.assignedElements()[0] ?? null);
  }

  #setTrigger(trigger) {
    if (trigger === this.#trigger) return;
    if (this.#trigger) {
      if (this.#triggerLabel === null) this.#trigger.removeAttribute("aria-label");
      else this.#trigger.setAttribute("aria-label", this.#triggerLabel);
    }
    this.#trigger = trigger;
    if (trigger) {
      this.#triggerLabel = trigger.getAttribute("aria-label");
      trigger.setAttribute("aria-label", this.label);
    }
  }

  #onPointerEnter = () => {
    this.#hovered = true;
    clearTimeout(this.#timer);
    if (this.#dismissed || this.#isOpen) return;
    this.#timer = setTimeout(() => {
      if (this.#hovered && !this.#dismissed) this.#open();
    }, OPEN_DELAY);
  };

  #onPointerLeave = () => {
    this.#hovered = false;
    this.#dismissed = false;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      if (!this.#hovered && !this.#focused) this.#close();
    }, CLOSE_DELAY);
  };

  #onFocusIn = (event) => {
    // Only keyboard focus opens it. The focused node may sit in the trigger's own shadow root.
    const focused = event.composedPath()[0];
    if (!(focused instanceof Element) || !focused.matches(":focus-visible")) return;
    this.#focused = true;
    this.#dismissed = false;
    this.#open();
  };

  #onFocusOut = () => {
    this.#focused = false;
    this.#dismissed = false;
    if (!this.#hovered) this.#close();
  };

  #onActivate = () => {
    this.#dismissed = true;
    this.#close();
  };

  #onKeydown = (event) => {
    if (event.key !== "Escape" || !this.#isOpen) return;
    // Capture phase, so a surrounding Dialog sees the event as handled (component.tooltip#escape-closes).
    event.preventDefault();
    event.stopPropagation();
    this.#dismissed = true;
    this.#close();
  };

  #onViewportChange = () => this.#position();

  #open() {
    if (this.#isOpen || this.hidden || !this.label || !this.#trigger) return;
    const document = this.ownerDocument;
    openTooltips.get(document)?.close();
    openTooltips.set(document, { owner: this, close: () => this.#close() });

    this.#bubble.showPopover();
    this.#position();
    document.addEventListener("keydown", this.#onKeydown, true);
    document.defaultView?.addEventListener("scroll", this.#onViewportChange, true);
    document.defaultView?.addEventListener("resize", this.#onViewportChange);
  }

  #close() {
    clearTimeout(this.#timer);
    if (!this.#isOpen) return;
    const document = this.ownerDocument;
    if (openTooltips.get(document)?.owner === this) openTooltips.delete(document);
    this.#bubble.hidePopover();
    document.removeEventListener("keydown", this.#onKeydown, true);
    document.defaultView?.removeEventListener("scroll", this.#onViewportChange, true);
    document.defaultView?.removeEventListener("resize", this.#onViewportChange);
  }

  /**
   * Place the bubble on the placement side, flip to the other side when it does
   * not fit, and keep it inside the viewport (component.tooltip#stays-in-view).
   * The bubble's block margin is the gap to the trigger.
   */
  #position() {
    if (!this.#isOpen || !this.#trigger) return;
    const bubble = this.#bubble;
    const anchor = this.#trigger.getBoundingClientRect();
    const style = getComputedStyle(bubble);
    const gap = parseFloat(style.marginTop) || 0;
    const width = bubble.offsetWidth;
    const height = bubble.offsetHeight;
    const viewport = this.ownerDocument.documentElement;
    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;

    const roomAbove = anchor.top - gap >= height;
    const roomBelow = anchor.bottom + gap + height <= viewportHeight;
    const above = this.placement === "above" ? roomAbove || !roomBelow : !roomBelow && roomAbove;

    // top is the margin box's edge: the bubble sits one gap inside it.
    const top = above ? anchor.top - height - 2 * gap : anchor.bottom;
    const centered = anchor.left + anchor.width / 2 - width / 2;
    const left = Math.min(Math.max(centered, gap), Math.max(viewportWidth - width - gap, gap));

    bubble.style.top = `${Math.max(top, -gap)}px`;
    bubble.style.left = `${left}px`;
  }
}

/** Register the element. Safe to call more than once. Defaults to "ds-tooltip". */
export const defineTooltip = defineElement("ds-tooltip", DsTooltip);
