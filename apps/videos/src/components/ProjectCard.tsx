import type { CSSProperties } from "react";
import { color, fonts } from "../theme";
import { UiButton } from "./UiButton";

/**
 * The settings screen the agent edits. The mistake, the rules, and the fix all draw this same card,
 * so the payoff reads as a correction of what the viewer already saw.
 * `placement` moves the action from the routine row (0) into its own section (1).
 * `marks` reveals numbered annotations for the three rules the first attempt breaks.
 */
export function ProjectCard({
  emphasis = false,
  label = false,
  placement = 0,
  marks = [0, 0, 0],
  style,
}: {
  emphasis?: boolean;
  label?: boolean;
  placement?: number;
  marks?: [number, number, number];
  style?: CSSProperties;
}) {
  const action = (
    <UiButton
      variant={emphasis ? "danger" : "primary"}
      label={label ? "Delete project" : "Remove"}
    />
  );
  return (
    <div
      style={{
        boxSizing: "border-box",
        background: color.card,
        border: `1px solid ${color.line}`,
        borderRadius: 18,
        padding: 44,
        boxShadow: "0 12px 36px rgba(34,26,19,.045)",
        ...style,
      }}
    >
      <div
        style={{ fontSize: 23, letterSpacing: 2, color: color.faint, textTransform: "uppercase" }}
      >
        Project settings
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 38, marginTop: 18 }}>Website redesign</div>
      <div
        style={{
          position: "relative",
          display: "inline-flex",
          gap: 20,
          padding: 10,
          margin: "18px -10px 0",
          borderRadius: 14,
          outline: `3px dashed ${color.rust}`,
          outlineColor: `rgba(208,48,37,${marks[2]})`,
        }}
      >
        <UiButton variant="secondary" label="Rename" />
        <UiButton variant="ghost" label="Archive" />
        {placement < 1 && (
          <div style={{ position: "relative", opacity: 1 - placement }}>
            {action}
            <Badge n={1} p={marks[0]} style={{ left: -16, top: -16 }} />
            <Badge n={2} p={marks[1]} style={{ right: -16, top: -16 }} />
          </div>
        )}
        <Badge n={3} p={marks[2]} style={{ right: -18, bottom: -18 }} />
      </div>
      <div
        style={{
          borderTop: `1px solid ${color.line}`,
          marginTop: 28,
          paddingTop: 26 * placement,
          height: placement * 220,
          opacity: placement,
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 600 }}>Delete this project</div>
        <div style={{ fontSize: 26, color: color.muted, margin: "10px 0 22px" }}>
          Permanently removes this project and its files.
        </div>
        {action}
      </div>
    </div>
  );
}

/** A numbered marker that ties part of the card to a rule. */
export function Badge({
  n,
  p,
  tone = color.rust,
  style,
}: {
  n: number;
  p: number;
  tone?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        width: 38,
        height: 38,
        borderRadius: 38,
        background: tone,
        color: "#fff",
        fontSize: 22,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: p,
        scale: `${0.6 + 0.4 * p}`,
        ...style,
      }}
    >
      {n}
    </div>
  );
}
