import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import {
  Children,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import "./tabs.css";

export interface TabSectionProps {
  /** Unique value that identifies the section. */
  value: string;
  /** Short text label shown on the section's tab. */
  label: string;
  /** The section's content, shown in the panel while its tab is selected. */
  children?: ReactNode;
}

/**
 * One section of Tabs: supplies its tab's label, a unique value, and the panel content.
 * Renders nothing on its own; Tabs reads its props.
 */
export function TabSection(_props: TabSectionProps): null {
  return null;
}

export interface TabsProps {
  /** Accessible name for the set of tabs. Not shown. */
  accessibleName: string;
  /** Selected section value (controlled). Empty or unmatched selects the first section. */
  value?: string;
  /** Initially selected section value (uncontrolled). */
  defaultValue?: string;
  /** Called when the user selects a different tab. Not called for programmatic changes. */
  onChange?: (value: string) => void;
  /** TabSection elements, in order. */
  children: ReactNode;
}

function readSections(children: ReactNode): TabSectionProps[] {
  const sections: TabSectionProps[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === TabSection) {
      sections.push((child as ReactElement<TabSectionProps>).props);
    }
  });
  return sections;
}

function resolveValue(sections: TabSectionProps[], value: string | undefined): string | undefined {
  if (value && sections.some((section) => section.value === value)) return value;
  return sections[0]?.value;
}

function warnContent(accessibleName: string, sections: TabSectionProps[]) {
  if (!accessibleName.trim()) {
    console.warn("Tabs: accessibleName is required (component.tabs#accessible-tabs).");
  }
  const labels = sections.map((section) => section.label.trim().toLowerCase());
  if (new Set(labels).size !== labels.length) {
    console.warn("Tabs: each tab label must differ (component.tabs#labels-short-and-unique).");
  }
  const values = sections.map((section) => section.value);
  if (new Set(values).size !== values.length) {
    console.warn("Tabs: each section value must be unique.");
  }
}

export function Tabs({ accessibleName, value, defaultValue, onChange, children }: TabsProps) {
  const sections = readSections(children);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selected = resolveValue(sections, isControlled ? value : uncontrolledValue);

  // Base UI reads reading direction from its own context, not from the DOM. Mirror the
  // computed direction so arrow keys follow the page's reading direction.
  const rootRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const computed = getComputedStyle(rootRef.current).direction === "rtl" ? "rtl" : "ltr";
    if (computed !== direction) setDirection(computed);
  });

  // With selection following focus, a pointer press on an unselected tab activates it on focus
  // and again on click. A controlled parent that has not applied the value yet would see both.
  // Report each value at most once per pointer or key interaction.
  const reportedRef = useRef<string | null>(null);
  const startInteraction = () => {
    reportedRef.current = null;
  };

  warnContent(accessibleName, sections);

  const current = sections.find((section) => section.value === selected);

  return (
    <DirectionProvider direction={direction}>
      {/* Base UI always runs controlled with the resolved value, so its automatic
          "initial" and "missing" fallbacks never fire and never reach onChange. */}
      <BaseTabs.Root
        ref={rootRef}
        className="ds-tabs"
        value={selected ?? null}
        onValueChange={(next: string, details) => {
          if (details.reason !== "none" || next === selected) return;
          if (reportedRef.current === next) return;
          reportedRef.current = next;
          if (!isControlled) setUncontrolledValue(next);
          onChange?.(next);
        }}
      >
        <BaseTabs.List
          className="ds-tabs__list"
          aria-label={accessibleName}
          activateOnFocus
          loopFocus
          onPointerDownCapture={startInteraction}
          onKeyDownCapture={startInteraction}
        >
          {sections.map((section) => (
            <BaseTabs.Tab key={section.value} value={section.value} className="ds-tabs__tab">
              {section.label}
            </BaseTabs.Tab>
          ))}
          <BaseTabs.Indicator className="ds-tabs__indicator" />
        </BaseTabs.List>
        {current && (
          <BaseTabs.Panel key={current.value} value={current.value} className="ds-tabs__panel">
            {current.children}
          </BaseTabs.Panel>
        )}
      </BaseTabs.Root>
    </DirectionProvider>
  );
}

Tabs.Section = TabSection;
