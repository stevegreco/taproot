import type { CSSProperties } from "react";
import { interpolateColors } from "remotion";
import { color, fonts } from "../theme";
import { UiButton } from "./UiButton";

/** Width of the card, and of the column that holds it, in every scene that draws it. */
export const CARD_WIDTH = 760;
/**
 * How far below the heading the card sits while it is the whole picture (the mistake and the
 * rules). The agent scene starts it there, then lifts it to make room for the agent's work.
 */
export const CARD_DROP = 130;

const S = 1.2;

/**
 * The settings screen the agent edits. The mistake, the rules, and the fix all draw this same card
 * in the same place, so the payoff reads as a correction of what the viewer already saw.
 * `placement` moves the action from the routine row (0) into its own section (1).
 * `marks` reveals numbered annotations for the three rules the first attempt breaks; `fixed` turns
 * each one from a broken rule (rust) to a followed one (sage).
 */
export function ProjectCard({
  emphasis = false,
  label = false,
  placement = 0,
  marks = [0, 0, 0],
  fixed = [0, 0, 0],
  style,
}: {
  emphasis?: boolean;
  label?: boolean;
  placement?: number;
  marks?: [number, number, number];
  fixed?: [number, number, number];
  style?: CSSProperties;
}) {
  const tone = (i: number) => interpolateColors(fixed[i], [0, 1], [color.rust, color.sage]);
  const action = (
    <div style={{ position: "relative", display: "inline-block" }}>
      <UiButton
        variant={emphasis ? "danger" : "primary"}
        label={label ? "Delete project" : "Remove"}
        scale={S}
      />
      <Badge n={1} p={marks[0]} tone={tone(0)} style={{ left: -18, top: -18 }} />
      <Badge n={2} p={marks[1]} tone={tone(1)} style={{ right: -18, top: -18 }} />
    </div>
  );
  // The third mark sits on whatever holds the action: the routine row, then its own section.
  const apart = placement > 0.5;
  return (
    <div
      style={{
        boxSizing: "border-box",
        width: CARD_WIDTH,
        background: color.card,
        border: `1px solid ${color.line}`,
        borderRadius: 20,
        padding: 52,
        boxShadow: "0 12px 36px rgba(34,26,19,.045)",
        ...style,
      }}
    >
      <div
        style={{ fontSize: 25, letterSpacing: 2, color: color.faint, textTransform: "uppercase" }}
      >
        Project settings
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 46, marginTop: 18 }}>Website redesign</div>
      <div
        style={{
          position: "relative",
          display: "inline-flex",
          gap: 22,
          padding: 12,
          margin: "22px -12px 0",
          borderRadius: 16,
          outlineWidth: 3,
          outlineStyle: "dashed",
          outlineColor: interpolateColors(
            marks[2] * (1 - placement),
            [0, 1],
            ["rgba(208,48,37,0)", tone(2)],
          ),
        }}
      >
        <UiButton variant="secondary" label="Rename" scale={S} />
        <UiButton variant="ghost" label="Archive" scale={S} />
        {placement < 1 && <div style={{ opacity: 1 - placement }}>{action}</div>}
        {!apart && <Badge n={3} p={marks[2]} tone={tone(2)} style={{ right: -20, bottom: -20 }} />}
      </div>
      <div
        style={{
          position: "relative",
          borderTop: `1px solid ${color.line}`,
          marginTop: 32,
          paddingTop: 30 * placement,
          height: placement * 250,
          opacity: placement,
        }}
      >
        {/* Side padding keeps the action's marks inside the clip while the section opens. */}
        <div style={{ overflow: "hidden", height: "100%", padding: "0 24px", margin: "0 -24px" }}>
          <div style={{ fontSize: 34, fontWeight: 600 }}>Delete this project</div>
          <div style={{ fontSize: 28, color: color.muted, margin: "10px 0 26px" }}>
            Permanently removes this project and its files.
          </div>
          <div style={{ paddingTop: 18 }}>{action}</div>
        </div>
        {apart && <Badge n={3} p={marks[2]} tone={tone(2)} style={{ right: -20, top: 14 }} />}
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
        width: 40,
        height: 40,
        borderRadius: 40,
        background: tone,
        color: "#fff",
        fontSize: 23,
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
