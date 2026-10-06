import type { CSSProperties, ReactNode } from "react";
import { color } from "../theme";

/** Dark surface for spec content: records, rules, and command output. */
export function Panel({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        background: color.ink,
        color: color.paper,
        borderRadius: 16,
        padding: 36,
        boxShadow: "0 8px 24px rgba(34,26,19,0.035)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
