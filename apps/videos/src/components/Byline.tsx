import type { CSSProperties } from "react";
import { color } from "../theme";

/** Author credit for the opening and closing title cards. */
export function Byline({ style }: { style?: CSSProperties }) {
  return (
    <div style={{ fontSize: 28, color: color.muted, letterSpacing: 0.5, ...style }}>
      By Stephen Greco
    </div>
  );
}
