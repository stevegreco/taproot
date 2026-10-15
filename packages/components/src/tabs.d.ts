/** The attributes `<ds-tabs>` accepts, for typing framework templates. */
export interface DsTabsAttributes {
  /** Accessible name for the set of tabs. Not shown. */
  label?: string;
  /** The selected section's value. Empty or unmatched selects the first section. */
  value?: string;
}

/** The attributes `<ds-tab-panel>` accepts, for typing framework templates. */
export interface DsTabPanelAttributes {
  /** The visible label of this section's tab. */
  label?: string;
  /** Unique within the tab set. Defaults to the label. */
  value?: string;
}

/** `<ds-tabs>`: Use Tabs to switch between a few related views of the same subject, one view visible at a time. */
export declare class DsTabs extends HTMLElement {
  label: string;
  /** The selected section's value. An unmatched value selects the first section. */
  value: string;
  focus(options?: FocusOptions): void;
  blur(): void;
}

/** `<ds-tab-panel>`: one section of a `<ds-tabs>`, supplying its tab's label and its content. */
export declare class DsTabPanel extends HTMLElement {
  label: string;
  /** Defaults to the label. */
  value: string;
}

/**
 * Registers `<ds-tabs>` and `<ds-tab-panel>`, or aliases when given tag names. Safe to call more
 * than once.
 */
export declare function defineTabs(tagName?: string, panelTagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    "ds-tabs": DsTabs;
    "ds-tab-panel": DsTabPanel;
  }
}
