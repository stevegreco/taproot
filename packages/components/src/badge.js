/**
 * <ds-badge> — a token-driven label for metadata and status.
 *
 * The badge is deliberately non-interactive and makes no live-region
 * announcement on its own. Consumers can add an appropriate role when the
 * badge communicates changing status.
 */

// Generated from src/badge.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/badge.styles.js";
import { Base, defineElement, lazyStyleSheet } from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);
const VARIANTS = new Set(["default", "accent", "success", "danger", "warning", "info"]);

export class DsBadge extends Base {
  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<span class="badge" part="badge"><slot></slot></span>`;
  }

  get variant() {
    const variant = this.getAttribute("variant");
    return VARIANTS.has(variant) ? variant : "default";
  }

  set variant(value) {
    this.setAttribute("variant", value);
  }
}

/** Register the element. Safe to call more than once. Defaults to "ds-badge". */
export const defineBadge = defineElement("ds-badge", DsBadge);
