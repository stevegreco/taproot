import { styles } from "../dist/tabs.styles.js";
import {
  Base,
  ForwardsFocus,
  defineElement,
  focusTarget,
  lazyStyleSheet,
} from "./internal/element.js";

const styleSheet = lazyStyleSheet(styles);

/** Called by a section when it connects, since sections parsed with the tab set upgrade after it. */
const sectionsChanged = Symbol("sectionsChanged");

/** One section of a tab set. It supplies its tab's label and a value; the tab set shows it. */
export class DsTabPanel extends Base {
  connectedCallback() {
    this.parentElement?.[sectionsChanged]?.();
  }
  get label() {
    return this.getAttribute("label") ?? "";
  }
  set label(value) {
    this.setAttribute("label", value ?? "");
  }
  /** Defaults to the label. */
  get value() {
    return this.getAttribute("value") ?? this.label;
  }
  set value(value) {
    if (value == null) this.removeAttribute("value");
    else this.setAttribute("value", value);
  }
}

/** A row of tabs above one panel. Direct section children supply the tabs and their content. */
export class DsTabs extends ForwardsFocus(Base) {
  static observedAttributes = ["label", "value"];
  #tabList;
  #panel;
  #slot;
  #observer;
  /** The section last chosen, so a tab whose value repeats an earlier one can still be selected. */
  #chosen;

  constructor() {
    super();
    // Manual assignment shows only the selected section; the rest are not rendered.
    const root = this.attachShadow({ mode: "open", slotAssignment: "manual" });
    root.adoptedStyleSheets = [styleSheet()];
    root.innerHTML = `<div class="tab-list" part="tab-list" role="tablist"></div>
      <div class="panel" part="panel" role="tabpanel" tabindex="0"><slot></slot></div>`;
    this.#tabList = root.querySelector(".tab-list");
    this.#panel = root.querySelector(".panel");
    this.#slot = root.querySelector("slot");
    this.#tabList.addEventListener("click", (event) => {
      const tab = event.target.closest('[role="tab"]');
      if (tab) this.#select(this.#tabs().indexOf(tab));
    });
    this.#tabList.addEventListener("keydown", (event) => this.#onKeydown(event));
    this.#observer = new MutationObserver((records) => {
      // Sections added, removed, or relabeled; changes inside a section's content are not ours.
      const ours = (record) =>
        record.type === "childList" ? record.target === this : record.target.parentElement === this;
      if (records.some(ours)) this.#render();
    });
  }

  connectedCallback() {
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["label", "value"],
    });
    this.#render();
  }
  disconnectedCallback() {
    this.#observer.disconnect();
  }
  attributeChangedCallback() {
    if (this.#tabList) this.#sync();
  }
  [sectionsChanged]() {
    this.#render();
  }
  get [focusTarget]() {
    return this.#tabList.querySelector('[aria-selected="true"]');
  }
  focus(options) {
    this[focusTarget]?.focus(options);
  }
  blur() {
    this.shadowRoot.activeElement?.blur();
  }
  get label() {
    return this.getAttribute("label") ?? "";
  }
  set label(value) {
    this.setAttribute("label", value ?? "");
  }
  /** The selected section's value. An unmatched value selects the first section. */
  get value() {
    return this.#selected()?.value ?? "";
  }
  set value(value) {
    if (value == null || value === "") this.removeAttribute("value");
    else this.setAttribute("value", value);
  }

  #panels() {
    return [...this.children].filter((child) => child instanceof DsTabPanel);
  }
  #tabs() {
    return [...this.#tabList.children];
  }
  #selected() {
    const panels = this.#panels();
    const value = this.getAttribute("value");
    if (panels.includes(this.#chosen) && this.#chosen.value === value) return this.#chosen;
    return panels.find((panel) => panel.value === value) ?? panels[0];
  }
  #render() {
    const focused = this.#tabs().indexOf(this.shadowRoot.activeElement);
    this.#tabList.replaceChildren(
      ...this.#panels().map((panel, index) => {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.id = `tab-${index}`;
        tab.className = "tab";
        tab.setAttribute("part", "tab");
        tab.setAttribute("role", "tab");
        const indicator = document.createElement("span");
        indicator.className = "indicator";
        indicator.setAttribute("part", "selected-indicator");
        indicator.setAttribute("aria-hidden", "true");
        tab.append(panel.label, indicator);
        return tab;
      }),
    );
    this.#sync();
    if (focused !== -1) (this.#tabs()[focused] ?? this[focusTarget])?.focus();
  }
  #sync() {
    const panels = this.#panels();
    const selected = this.#selected();
    this.#tabList.setAttribute("aria-label", this.label);
    for (const [index, tab] of this.#tabs().entries()) {
      const isSelected = panels[index] === selected;
      tab.setAttribute("aria-selected", String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      if (isSelected) this.#panel.setAttribute("aria-labelledby", tab.id);
    }
    this.#panel.hidden = !selected;
    this.#slot.assign(...(selected ? [selected] : []));
  }
  #select(index) {
    const panel = this.#panels()[index];
    if (!panel) return;
    const changed = panel !== this.#selected();
    if (changed) {
      this.#chosen = panel;
      this.setAttribute("value", panel.value);
      this.#sync();
    }
    this.#tabs()[index].focus();
    if (changed) this.dispatchEvent(new Event("change", { bubbles: true }));
  }
  #onKeydown(event) {
    const count = this.#tabs().length;
    const current = this.#tabs().indexOf(this.shadowRoot.activeElement);
    if (current === -1 || count === 0) return;
    const forward = getComputedStyle(this).direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const backward = forward === "ArrowRight" ? "ArrowLeft" : "ArrowRight";
    const target = {
      [forward]: (current + 1) % count,
      [backward]: (current - 1 + count) % count,
      Home: 0,
      End: count - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    this.#select(target);
  }
}

/**
 * Registers the tab set under `tagName` and its sections under `panelTagName`. The tab set finds
 * its sections by class, so either can be an alias.
 */
export function defineTabs(tagName = "ds-tabs", panelTagName = "ds-tab-panel") {
  definePanel(panelTagName);
  defineTabSet(tagName);
}
const definePanel = defineElement("ds-tab-panel", DsTabPanel);
const defineTabSet = defineElement("ds-tabs", DsTabs);
