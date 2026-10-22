/**
 * <ds-avatar> — Use Avatar to show a small picture of a person, so people can recognize who did, owns, or wrote something.
 *
 * Shows the picture once it loads, otherwise the initials of the name, otherwise
 * a generic person symbol. It is a named image when it has a name and is not
 * decorative, and hidden from assistive technology otherwise. Both are set
 * through ElementInternals, so the host never sprouts role or aria-* attributes
 * of its own. Behavior is in the spec: `pnpm spec get component.avatar`.
 */

// Generated from src/avatar.css by build-styles.js (run `pnpm run build`).
import { styles } from "../dist/avatar.styles.js";
import { Base, defineElement, lazyStyleSheet } from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);
const SIZE_VALUES = new Set(["small", "medium", "large"]);

const PLACEHOLDER = `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0z"/></svg>`;

/** The first letter of the first and last words, uppercased. */
function initialsOf(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = [...words[0]][0];
  const last = words.length > 1 ? [...words[words.length - 1]][0] : "";
  return (first + last).toLocaleUpperCase();
}

export class DsAvatar extends Base {
  static observedAttributes = ["name", "image", "decorative"];

  #internals;
  #image;
  #initials;
  #placeholder;
  #loaded = false;

  constructor() {
    super();

    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<span class="surface" part="surface"><img class="image" part="image" alt="" hidden><span class="initials" part="initials" hidden></span><span class="placeholder" part="placeholder" hidden>${PLACEHOLDER}</span></span>`;

    this.#image = root.querySelector(".image");
    this.#initials = root.querySelector(".initials");
    this.#placeholder = root.querySelector(".placeholder");
    this.#image.addEventListener("load", () => this.#setLoaded(true));
    this.#image.addEventListener("error", () => this.#setLoaded(false));

    this.#internals = this.attachInternals();
    this.#syncImage();
    this.#sync();
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (attribute === "image" && oldValue !== newValue) this.#syncImage();
    this.#sync();
  }

  #syncImage() {
    this.#loaded = false;
    const image = this.image;
    if (image) this.#image.setAttribute("src", image);
    else this.#image.removeAttribute("src");
  }

  #setLoaded(loaded) {
    // An event from a picture that was replaced or removed since is stale.
    if (this.#image.getAttribute("src") !== (this.image || null)) return;
    this.#loaded = loaded;
    this.#sync();
  }

  #sync() {
    const name = this.name.trim();
    const initials = initialsOf(name);
    const showImage = this.#loaded && Boolean(this.image);
    this.#initials.textContent = initials;
    this.#image.hidden = !showImage;
    this.#initials.hidden = showImage || !initials;
    this.#placeholder.hidden = showImage || Boolean(initials);

    const named = Boolean(name) && !this.decorative;
    this.#internals.role = named ? "img" : null;
    this.#internals.ariaLabel = named ? name : null;
    this.#internals.ariaHidden = named ? null : "true";
  }

  get name() {
    return this.getAttribute("name") ?? "";
  }

  set name(value) {
    this.setAttribute("name", value);
  }

  get image() {
    return this.getAttribute("image") ?? "";
  }

  set image(value) {
    this.setAttribute("image", value);
  }

  get size() {
    const value = this.getAttribute("size");
    return SIZE_VALUES.has(value) ? value : "medium";
  }

  set size(value) {
    this.setAttribute("size", value);
  }

  get decorative() {
    return this.hasAttribute("decorative");
  }

  set decorative(value) {
    this.toggleAttribute("decorative", Boolean(value));
  }
}

/** Register the element. Safe to call more than once. Defaults to "ds-avatar". */
export const defineAvatar = defineElement("ds-avatar", DsAvatar);
