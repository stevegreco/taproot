/**
 * Runtime pieces every component shares. Not public API: the package `exports`
 * map blocks `./internal/*`.
 */

/** Importing on a server must not throw, so fall back to an inert base class. */
export const Base = typeof HTMLElement === "undefined" ? class {} : HTMLElement;

/**
 * One constructable stylesheet shared by every instance of a component. Built
 * on first use, so importing a component module is safe on a server.
 * @param {string} css
 * @returns {() => CSSStyleSheet}
 */
export function lazyStyleSheet(css) {
  let sheet;
  return () => {
    if (!sheet) {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
    }
    return sheet;
  };
}

/** Symbol-keyed getter a component defines to name its inner focusable control. */
export const focusTarget = Symbol("focusTarget");

/**
 * Adds focus() and blur() that forward to `this[focusTarget]`, the real control
 * inside the shadow root.
 * @template {new (...args: any[]) => object} T
 * @param {T} Superclass
 */
export function ForwardsFocus(Superclass) {
  return class extends Superclass {
    /** Forward programmatic focus to the real control inside the shadow root. */
    focus(options) {
      this[focusTarget].focus(options);
    }

    blur() {
      this[focusTarget].blur();
    }
  };
}

/**
 * Build a component's `define*` export.
 *
 * A CustomElementRegistry can only associate a constructor with one name, so
 * each call registers a trivial subclass. That keeps `instanceof Element` true
 * while allowing aliases. The subclass also replays properties that were set
 * before the element was defined (see `upgradeProperties`).
 *
 * @param {string} defaultTagName
 * @param {CustomElementConstructor} Element
 * @returns {(tagName?: string) => void}
 */
export function defineElement(defaultTagName, Element) {
  return (tagName = defaultTagName) => {
    if (typeof customElements === "undefined") return;
    if (customElements.get(tagName)) return;
    customElements.define(
      tagName,
      class extends Element {
        connectedCallback() {
          upgradeProperties(this);
          super.connectedCallback?.();
        }
      },
    );
  };
}

/**
 * A property set on an element before its definition runs lands as an own
 * property of the plain HTMLElement, and after upgrade it shadows the class
 * setter. Move each such value through the setter. This runs on connect, not
 * in the constructor, because attribute changes made while an element is
 * upgrading do not reach attributeChangedCallback.
 * @param {HTMLElement} element
 */
export function upgradeProperties(element) {
  for (const name of accessorNames(Object.getPrototypeOf(element))) {
    if (!Object.hasOwn(element, name)) continue;
    const value = element[name];
    delete element[name];
    element[name] = value;
  }
}

/** Settable accessors a component class declares, stopping at the platform base. */
function accessorNames(prototype) {
  const names = new Set();
  for (let proto = prototype; proto && proto !== Base.prototype;) {
    for (const [name, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
      if (descriptor.set) names.add(name);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return names;
}
