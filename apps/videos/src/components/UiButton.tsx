import type { CSSProperties } from "react";
import { color, fonts } from "../theme";

export type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, CSSProperties> = {
  primary: { background: color.ember, color: color.ink, border: `2px solid ${color.ember}` },
  secondary: { background: color.card, color: color.ink, border: `2px solid ${color.line}` },
  ghost: { background: "transparent", color: color.emberDeep, border: "2px solid transparent" },
  danger: { background: color.rust, color: "#fff", border: `2px solid ${color.rust}` },
};

/** A drawing of a button, for illustration only. */
export function UiButton({
  variant,
  label,
  scale = 1,
  style,
}: {
  variant: Variant;
  label: string;
  scale?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        ...styles[variant],
        fontFamily: fonts.sans,
        fontWeight: 600,
        fontSize: 26 * scale,
        padding: `${12 * scale}px ${26 * scale}px`,
        borderRadius: 10 * scale,
        whiteSpace: "nowrap",
        display: "inline-block",
        ...style,
      }}
    >
      {label}
    </div>
  );
}
