/**
 * <ds-link> — a token-driven link for navigation.
 *
 * Navigation is the inner anchor's native behavior, so middle-click, modifier
 * keys, and the context menu work without script. Link is not form-associated.
 */

// Generated from src/link.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/link.styles.js";
import {
  Base,
  ForwardsFocus,
  defineElement,
  focusTarget,
  lazyStyleSheet,
} from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);

export class DsLink extends ForwardsFocus(Base) {
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

  get [focusTarget]() {
    return this.#anchor;
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

/** Register the element. Safe to call more than once. Defaults to "ds-link". */
export const defineLink = defineElement("ds-link", DsLink);
