import { styles } from "../dist/dialog.styles.js";
import {
  Base,
  ForwardsFocus,
  defineElement,
  focusTarget,
  lazyStyleSheet,
} from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);
const scrollLocks = new WeakMap();
const openDialogs = new WeakMap();

function deepestFocus(document) {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

function tabbables(root) {
  const controls = [];
  function visit(element) {
    if (element instanceof HTMLSlotElement) {
      for (const child of element.assignedElements({ flatten: true })) visit(child);
      return;
    }
    if (
      element.tabIndex >= 0 &&
      !element.matches(":disabled") &&
      !element.closest("[inert]") &&
      element.getClientRects().length
    ) {
      controls.push(element);
    }
    const children = element.shadowRoot?.children ?? element.children;
    for (const child of children) visit(child);
  }
  for (const child of root.children) visit(child);
  return controls.sort((a, b) => (a.tabIndex || Infinity) - (b.tabIndex || Infinity));
}

export class DsDialog extends ForwardsFocus(Base) {
  static observedAttributes = ["open", "label", "description", "dismissible", "hidden"];
  #dialog;
  #title;
  #description;
  #previousFocus;
  #lockedDocument;
  #wasOpen = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<dialog part="dialog" closedby="none" aria-labelledby="title" aria-modal="true">
      <h2 id="title" part="title" tabindex="-1"></h2>
      <p id="description" part="description" hidden></p>
      <div part="content"><slot></slot></div>
      <div part="actions"><slot name="actions"></slot></div>
    </dialog>`;
    this.#dialog = root.querySelector("dialog");
    this.#title = root.querySelector("h2");
    this.#description = root.querySelector("p");
    this.#dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      this.#requestCancel();
    });
    this.#dialog.addEventListener("close", () => {
      if (!this.#dialog.open && this.#wasOpen) {
        this.removeAttribute("open");
        this.#finishClose();
      }
    });
  }

  connectedCallback() {
    this.#sync();
  }

  disconnectedCallback() {
    if (this.#dialog.open) this.#dialog.close();
    this.#finishClose();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    this.#title.textContent = this.label;
    this.#description.textContent = this.description;
    this.#description.hidden = !this.description;
    if (this.description) this.#dialog.setAttribute("aria-describedby", "description");
    else this.#dialog.removeAttribute("aria-describedby");
    if (this.open && !this.hidden && this.isConnected) {
      if (this.#dialog.open) return;
      this.#previousFocus = deepestFocus(this.ownerDocument);
      this.#dialog.showModal();
      this.#wasOpen = true;
      this.#lockScroll();
      this.ownerDocument.addEventListener("keydown", this.#onKeydown);
      const initial = this.querySelector("[autofocus]");
      (initial ?? this.#title).focus({ preventScroll: true });
    } else if (this.#dialog.open) {
      this.#dialog.close();
      this.#finishClose();
    }
  }

  #requestCancel() {
    if (!this.dismissible) return;
    if (
      this.dispatchEvent(new Event("cancel", { cancelable: true, bubbles: true, composed: true }))
    )
      this.close();
  }

  #onKeydown = (event) => {
    if (
      !this.#dialog.open ||
      event.defaultPrevented ||
      event.isComposing ||
      openDialogs.get(this.ownerDocument)?.at(-1) !== this ||
      !event.composedPath().includes(this)
    )
      return;
    if (event.key === "Escape") {
      // Own Escape dismissal after child controls have handled it. closedby="none"
      // also prevents native dismissal when a child stops propagation or IME consumes Escape.
      event.preventDefault();
      this.#requestCancel();
      return;
    }
    if (event.key !== "Tab") return;
    const items = tabbables(this.#dialog);
    const active = deepestFocus(this.ownerDocument);
    const index = items.indexOf(active);
    if (!items.length) {
      event.preventDefault();
      this.#title.focus();
    } else if (
      index < 0 ||
      (!event.shiftKey && index === items.length - 1) ||
      (event.shiftKey && index === 0)
    ) {
      event.preventDefault();
      items[event.shiftKey ? items.length - 1 : 0].focus();
    }
  };

  #lockScroll() {
    const document = this.ownerDocument;
    const dialogs = openDialogs.get(document) ?? [];
    dialogs.push(this);
    openDialogs.set(document, dialogs);
    let lock = scrollLocks.get(document);
    if (!lock) {
      const style = document.documentElement.style;
      lock = {
        count: 0,
        overflow: style.getPropertyValue("overflow"),
        priority: style.getPropertyPriority("overflow"),
      };
      scrollLocks.set(document, lock);
      style.setProperty("overflow", "hidden");
    }
    lock.count += 1;
    this.#lockedDocument = document;
  }

  #finishClose() {
    const document = this.#lockedDocument;
    if (document) {
      const dialogs = openDialogs.get(document);
      dialogs.splice(dialogs.indexOf(this), 1);
      if (!dialogs.length) openDialogs.delete(document);
      document.removeEventListener("keydown", this.#onKeydown);
      const lock = scrollLocks.get(document);
      if (--lock.count === 0) {
        if (lock.overflow)
          document.documentElement.style.setProperty("overflow", lock.overflow, lock.priority);
        else document.documentElement.style.removeProperty("overflow");
        scrollLocks.delete(document);
      }
      this.#lockedDocument = undefined;
    }
    if (!this.#wasOpen) return;
    this.#wasOpen = false;
    if (this.#previousFocus?.isConnected) this.#previousFocus.focus({ preventScroll: true });
    this.#previousFocus = undefined;
    this.dispatchEvent(new Event("close", { bubbles: true, composed: true }));
  }

  get [focusTarget]() {
    return this.#title;
  }
  get open() {
    return this.hasAttribute("open");
  }
  set open(value) {
    this.toggleAttribute("open", Boolean(value));
  }
  get label() {
    return this.getAttribute("label") ?? "";
  }
  set label(value) {
    this.setAttribute("label", value);
  }
  get description() {
    return this.getAttribute("description") ?? "";
  }
  set description(value) {
    this.setAttribute("description", value);
  }
  get dismissible() {
    return this.getAttribute("dismissible") !== "false";
  }
  set dismissible(value) {
    this.setAttribute("dismissible", String(Boolean(value)));
  }
  showModal() {
    this.open = true;
  }
  close() {
    this.open = false;
  }
}

export const defineDialog = defineElement("ds-dialog", DsDialog);
