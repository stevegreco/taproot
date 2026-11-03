import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  I18nProvider,
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
  type Key,
} from "react-aria-components";
import { useDirectionLocale } from "../internal/direction";
import "./tabs.css";

/**
 * One section of a Tabs set. It supplies its tab's label, a unique value, and the panel content.
 * It renders nothing on its own: Tabs reads its props.
 */
export interface TabsSectionProps {
  /** Unique value that identifies this section. `Tabs` reports it on change. */
  value: string;
  /** Short text label shown on the tab. Must differ from the other labels. */
  label: string;
  /** Panel content, shown when this section is selected. */
  children?: ReactNode;
}

export function TabsSection(_props: TabsSectionProps): null {
  return null;
}

export interface TabsProps {
  /** Accessible name for the set of tabs. Not shown. */
  accessibleName: string;
  /**
   * The selected section's value (controlled). Empty or unmatched selects the first section.
   * Pair with `onChange`.
   */
  value?: string;
  /** The initially selected section's value (uncontrolled). Empty or unmatched selects the first. */
  defaultValue?: string;
  /**
   * Called when the person selects a different tab by pointer or keyboard. Not called for
   * programmatic changes or for choosing the tab that is already selected.
   */
  onChange?: (value: string) => void;
  /** `TabsSection` elements, in order. */
  children: ReactNode;
  className?: string;
}

function readSections(children: ReactNode): TabsSectionProps[] {
  const sections: TabsSectionProps[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === TabsSection) {
      sections.push((child as ReactElement<TabsSectionProps>).props);
    }
  });
  return sections;
}

function warnOnContent(accessibleName: string, sections: TabsSectionProps[]) {
  if (!accessibleName.trim()) {
    console.warn("Tabs: accessibleName is empty. The set of tabs needs an accessible name.");
  }
  const values = new Set<string>();
  const labels = new Set<string>();
  for (const { value, label } of sections) {
    if (values.has(value)) console.warn(`Tabs: section value "${value}" is used more than once.`);
    if (labels.has(label)) console.warn(`Tabs: tab label "${label}" is used more than once.`);
    if (!label.trim()) console.warn("Tabs: a section has an empty label.");
    values.add(value);
    labels.add(label);
  }
}

/** Resolve a requested value to a section value: unmatched or empty selects the first section. */
function resolve(requested: string | undefined, sections: TabsSectionProps[]): string | undefined {
  if (requested && sections.some((s) => s.value === requested)) return requested;
  return sections[0]?.value;
}

export function Tabs({
  accessibleName,
  value,
  defaultValue,
  onChange,
  children,
  className,
}: TabsProps) {
  const allSections = readSections(children);
  // React Aria throws on a repeated key, so a section whose value repeats is warned about and left out.
  const sections = allSections.filter(
    (s, i) => allSections.findIndex((other) => other.value === s.value) === i,
  );
  const contentKey = JSON.stringify([accessibleName, allSections.map((s) => [s.value, s.label])]);
  useEffect(() => warnOnContent(accessibleName, allSections), [contentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const selected = resolve(isControlled ? value : internal, sections);

  // React Aria reports a change only when the key differs from the selected key, so choosing the
  // selected tab reports nothing. Keeping React Aria controlled with an already-resolved key stops
  // its own fallback to the first tab from reporting a change.
  const handleSelectionChange = useCallback(
    (key: Key) => {
      const next = String(key);
      if (next === selected) return;
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [selected, isControlled, onChange],
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const locale = useDirectionLocale(rootRef);

  const tabList = (
    <AriaTabList aria-label={accessibleName} className="ds-tabs__list">
      {sections.map((section) => (
        <AriaTab key={section.value} id={section.value} className="ds-tabs__tab">
          {section.label}
        </AriaTab>
      ))}
    </AriaTabList>
  );

  return (
    <AriaTabs
      ref={rootRef}
      className={className ? `ds-tabs ${className}` : "ds-tabs"}
      selectedKey={selected}
      onSelectionChange={handleSelectionChange}
      keyboardActivation="automatic"
      orientation="horizontal"
    >
      {locale ? <I18nProvider locale={locale}>{tabList}</I18nProvider> : tabList}
      {sections.map((section) => (
        <AriaTabPanel key={section.value} id={section.value} className="ds-tabs__panel">
          {section.children}
        </AriaTabPanel>
      ))}
    </AriaTabs>
  );
}
