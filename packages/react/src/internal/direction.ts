/**
 * React Aria takes reading direction from its locale, not from the page. A component that moves
 * with arrow keys or positions by direction reads the direction it actually renders in, and wraps
 * the affected part in a locale with that direction when the two disagree.
 */
import { useLayoutEffect, useState, type RefObject } from "react";
import { useLocale } from "react-aria-components";

/** A locale to give the part under `ref`, or undefined when React Aria's locale already matches. */
export function useDirectionLocale(ref: RefObject<HTMLElement | null>): string | undefined {
  const { direction } = useLocale();
  const [override, setOverride] = useState<string | undefined>(undefined);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const domDirection = getComputedStyle(el).direction === "rtl" ? "rtl" : "ltr";
    const next = domDirection === direction ? undefined : domDirection === "rtl" ? "ar" : "en-US";
    setOverride((current) => (current === next ? current : next));
  });
  return override;
}
