/**
 * <ds-link> — a token-driven link for navigation.
 *
 * Navigation is the inner anchor's native behavior, so middle-click, modifier
 * keys, and the context menu work without script. Link is not form-associated.
 */

// Generated from src/link.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/link.styles.js";

/** Shared across every instance; built lazily so importing this module is safe on a server. */
let sheet;

function styleSheet() {
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(styles);
  }
  return sheet;
}

/** Importing on a server must not throw, so fall back to an inert base class. */
const Base = typeof HTMLElement === "undefined" ? class {} : HTMLElement;

export class DsLink extends Base {
  static observedAttributes = ["href"];

  #anchor;

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<a class="link" part="link"><slot></slot></a>`;

    this.#anchor = root.querySelector("a");
  }

  attributeChangedCallback(name, _old, value) {
    if (name !== "href") return;
    // An anchor without href has no link role and is not focusable, which is
    // the contract for a link with no destination.
    if (value === null) this.#anchor.removeAttribute("href");
    else this.#anchor.setAttribute("href", value);
  }

  /** Forward programmatic focus to the real anchor inside the shadow root. */
  focus(options) {
    this.#anchor.focus(options);
  }

  blur() {
    this.#anchor.blur();
  }

  /**
   * Activate the anchor, as a native <a>.click() would. The host is not the
   * anchor, so HTMLElement.prototype.click on it would never navigate. The
   * anchor's click is composed, so listeners on the host still see it once.
   */
  click() {
    this.#anchor.click();
  }

  get href() {
    return this.getAttribute("href") ?? "";
  }

  set href(value) {
    this.setAttribute("href", value);
  }

  get variant() {
    return this.getAttribute("variant") === "standalone" ? "standalone" : "inline";
  }

  set variant(value) {
    this.setAttribute("variant", value);
  }
}

/**
 * Register the element. Safe to call more than once.
 * @param {string} [tagName] custom tag name, defaults to "ds-link".
 */
export function defineLink(tagName = "ds-link") {
  if (typeof customElements === "undefined") return;
  if (!customElements.get(tagName)) {
    customElements.define(tagName, class extends DsLink {});
  }
}
