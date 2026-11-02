import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import "./tabs.css";

/** One section: its tab's label, a unique value, and the panel content shown when it is selected. */
export interface TabsSectionProps {
  /** Unique value of the section, reported by onChange and matched against `value`. */
  value: string;
  /** Short text label shown on the tab and used to name the panel. */
  label: string;
  /** Panel content. */
  children?: ReactNode;
}

/**
 * Declares a section. It renders nothing by itself: Tabs reads its props to build the tab and the
 * panel, so sections stay ordered content written as children.
 */
export function TabsSection(_props: TabsSectionProps): null {
  return null;
}

export interface TabsProps {
  /** Accessible name for the set of tabs. Not shown. */
  accessibleName: string;
  /** Selected section value (controlled). Empty or unmatched selects the first section. */
  value?: string;
  /** Initially selected section value (uncontrolled). */
  defaultValue?: string;
  /** Called with the new value when a person selects a different tab by pointer or keyboard. */
  onChange?: (value: string) => void;
  /** TabsSection elements, in tab order. */
  children: ReactNode;
  className?: string;
}

function collectSections(children: ReactNode): TabsSectionProps[] {
  const sections: TabsSectionProps[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === TabsSection) {
      sections.push((child as ReactElement<TabsSectionProps>).props);
    }
  });
  return sections;
}

function warnContent(accessibleName: string, sections: TabsSectionProps[]): void {
  if (!accessibleName.trim()) {
    console.warn("Tabs: accessibleName is required (component.tabs#labels-short-and-unique).");
  }
  const labels = new Set<string>();
  const values = new Set<string>();
  for (const { label, value } of sections) {
    const key = label.trim().toLowerCase();
    if (labels.has(key)) {
      console.warn(`Tabs: duplicate label "${label}" (component.tabs#labels-short-and-unique).`);
    }
    if (values.has(value)) {
      console.warn(`Tabs: duplicate value "${value}"; each section needs a unique value.`);
    }
    labels.add(key);
    values.add(value);
  }
}

export function Tabs({
  accessibleName,
  value,
  defaultValue,
  onChange,
  children,
  className,
}: TabsProps) {
  const sections = collectSections(children);
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const requested = controlled ? value : internal;
  // Empty or unmatched selects the first section (component.tabs#one-selected).
  const selectedIndex = Math.max(
    0,
    sections.findIndex((s) => s.value === requested),
  );
  const selected = sections[selectedIndex];

  const baseId = useId();
  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = `${baseId}-panel`;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // Re-check only when the labels, values, or name change.
  const contentKey = sections.map((s) => `${s.value}\u0000${s.label}`).join("\u0001");
  useEffect(() => {
    warnContent(accessibleName, sections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessibleName, contentKey]);

  const select = useCallback(
    (index: number) => {
      const next = sections[index];
      if (!next || index === selectedIndex) return;
      if (!controlled) setInternal(next.value);
      onChange?.(next.value);
    },
    [sections, selectedIndex, controlled, onChange],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = sections.length;
    if (count === 0) return;
    const rtl = listRef.current ? getComputedStyle(listRef.current).direction === "rtl" : false;
    let target: number | null = null;
    switch (event.key) {
      case "ArrowRight":
        target = (index + (rtl ? -1 : 1) + count) % count;
        break;
      case "ArrowLeft":
        target = (index + (rtl ? 1 : -1) + count) % count;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    tabRefs.current[target]?.focus();
    select(target);
  };

  return (
    <div className={className ? `ds-tabs ${className}` : "ds-tabs"}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={accessibleName}
        aria-orientation="horizontal"
        className="ds-tabs__list"
      >
        {sections.map((section, i) => {
          const isSelected = i === selectedIndex;
          return (
            <button
              key={section.value}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={tabId(i)}
              className="ds-tabs__tab"
              aria-selected={isSelected}
              aria-controls={isSelected ? panelId : undefined}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {section.label}
            </button>
          );
        })}
      </div>
      {selected && (
        <div
          role="tabpanel"
          id={panelId}
          aria-labelledby={tabId(selectedIndex)}
          tabIndex={0}
          className="ds-tabs__panel"
        >
          {selected.children}
        </div>
      )}
    </div>
  );
}

Tabs.Section = TabsSection;
