import type { CSSProperties, ReactNode } from "react";
import { fonts } from "../theme";

export function Pill({
  bg,
  fg,
  children,
  style,
}: {
  bg: string;
  fg: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        background: bg,
        color: fg,
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        padding: "5px 12px",
        borderRadius: 999,
        display: "inline-block",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
