/**
 * <ds-badge> — a token-driven label for metadata and status.
 *
 * The badge is deliberately non-interactive and makes no live-region
 * announcement on its own. Consumers can add an appropriate role when the
 * badge communicates changing status.
 */

// Generated from src/badge.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/badge.styles.js";

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

export class DsBadge extends Base {
  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<span class="badge" part="badge"><slot></slot></span>`;
  }

  get variant() {
    return this.getAttribute("variant") ?? "default";
  }

  set variant(value) {
    this.setAttribute("variant", value);
  }
}

/**
 * Register the element. Safe to call more than once.
 * @param {string} [tagName] custom tag name, defaults to "ds-badge".
 */
export function defineBadge(tagName = "ds-badge") {
  if (typeof customElements === "undefined") return;
  if (!customElements.get(tagName)) {
    customElements.define(tagName, class extends DsBadge {});
  }
}
