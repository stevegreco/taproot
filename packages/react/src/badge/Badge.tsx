import { useEffect, useRef, type ReactNode } from "react";
import "./badge.css";

export type BadgeVariant = "default" | "accent" | "success" | "danger" | "warning" | "info";

export interface BadgeProps {
  /** Status or category the badge conveys. Each variant has its own colors. Defaults to `default`. */
  variant?: BadgeVariant;
  /**
   * Optional leading icon, shown before the label. It is decorative: the label text must state the
   * status on its own.
   */
  icon?: ReactNode;
  /** The label: short text that states the status or metadata. */
  children: ReactNode;
  className?: string;
}

const variants: readonly BadgeVariant[] = [
  "default",
  "accent",
  "success",
  "danger",
  "warning",
  "info",
];

/**
 * A non-interactive label for status or metadata. Not a control and not a live region.
 * React Aria has no badge component, so this is plain React.
 */
export function Badge({ variant = "default", icon, children, className }: BadgeProps) {
  const resolved = variants.includes(variant) ? variant : "default";
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!variants.includes(variant)) {
      console.warn(`Badge: unknown variant "${String(variant)}". Using "default".`);
    }
  }, [variant]);

  // not-color-alone: the label text, not the color or icon, carries the meaning.
  useEffect(() => {
    if (!labelRef.current?.textContent?.trim()) {
      console.warn(
        "Badge: the label is empty. The text must state the status; color alone does not.",
      );
    }
  }, [children]);

  return (
    <span className={className ? `ds-badge ${className}` : "ds-badge"} data-variant={resolved}>
      {icon != null && icon !== false ? (
        <span className="ds-badge__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span ref={labelRef} className="ds-badge__label">
        {children}
      </span>
    </span>
  );
}
