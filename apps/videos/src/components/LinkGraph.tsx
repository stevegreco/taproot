import { Easing, interpolate, useCurrentFrame } from "remotion";
import { color, fonts } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (frame: number, start: number, length = 16) =>
  interpolate(frame, [start, start + length], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

// Geometry: the Button spec on the left, the records it links to on the right.
const SPEC = { x: 0, y: 30, w: 820 };
const CARD = { x: 1080, w: 600, h: 132 };

/**
 * Fields in component.button that create links, from SPEC.md: an enum value's `guidance` and a
 * rule's `references` create `follows` links; the guideline's `related` link appears here as its
 * inverse, which tools add.
 */
const fields = [
  {
    field: "parameters.variant.danger",
    value: "guidance → pattern.action-hierarchy#danger",
    target: "pattern",
    cue: "patterns",
    y: 222,
  },
  {
    field: "rules.follow-action-hierarchy",
    value: "references → pattern.action-hierarchy#assign-emphasis",
    target: "pattern",
    cue: "patterns",
    y: 352,
  },
  {
    field: "links",
    value: "related ← guideline.compose-or-propose",
    target: "guideline",
    cue: "guidelines",
    y: 482,
  },
] as const;

const records = {
  pattern: {
    type: "Pattern",
    title: "Action hierarchy",
    note: "#danger · #assign-emphasis",
    tone: color.sage,
    y: 30,
    cue: "patterns",
  },
  example: {
    type: "Example",
    title: "Settings action hierarchy",
    note: "example-of the pattern",
    tone: color.slate,
    y: 236,
    cue: "examples",
  },
  guideline: {
    type: "Guideline",
    title: "Compose or propose",
    note: "related to Button",
    tone: color.sky,
    y: 442,
    cue: "guidelines",
  },
} as const;

const mid = (key: keyof typeof records) => records[key].y + CARD.h / 2;

/**
 * The links come out of the contract itself: each field lights up and draws a link to the record
 * it names, as the narration names that record type.
 */
export function LinkGraph({ cues }: { cues: Record<string, number> }) {
  const frame = useCurrentFrame();
  const spec = ease(frame, cues.start - 6, 14);
  return (
    <div style={{ position: "relative", width: 1680, height: 620 }}>
      <svg width="1680" height="620" style={{ position: "absolute", inset: 0 }}>
        {fields.map(({ field, target, cue, y }, i) => {
          const ty = mid(target) + (i === 0 ? -18 : i === 1 ? 18 : 0);
          const x1 = SPEC.x + SPEC.w;
          return (
            <path
              key={field}
              d={`M ${x1} ${y} C ${x1 + 140} ${y}, ${CARD.x - 140} ${ty}, ${CARD.x} ${ty}`}
              fill="none"
              stroke={color.sage}
              strokeWidth={3}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - ease(frame, cues[cue] + i * 8, 20)}
            />
          );
        })}
        {/* The example points at the pattern it demonstrates. */}
        <path
          d={`M ${CARD.x + 300} ${records.example.y} L ${CARD.x + 300} ${records.pattern.y + CARD.h}`}
          stroke={color.faint}
          strokeWidth={3}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ease(frame, cues.examples + 6, 14)}
        />
      </svg>
      <div
        style={{
          boxSizing: "border-box",
          position: "absolute",
          left: SPEC.x,
          top: SPEC.y,
          width: SPEC.w,
          height: 560,
          background: color.ink,
          color: color.paper,
          borderRadius: 18,
          padding: "30px 40px",
          opacity: spec,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
          <div style={{ fontFamily: fonts.display, fontSize: 42 }}>Button</div>
          <div style={{ fontFamily: fonts.mono, fontSize: 22, color: color.emberSoft }}>
            component.button
          </div>
        </div>
      </div>
      {fields.map(({ field, value, cue, y }, i) => {
        const lit = ease(frame, cues[cue] - 6 + i * 8, 12);
        return (
          <div
            key={field}
            style={{
              boxSizing: "border-box",
              position: "absolute",
              left: SPEC.x + 16,
              top: y - 50,
              width: SPEC.w - 32,
              height: 100,
              padding: "16px 24px",
              borderRadius: 12,
              color: color.paper,
              background: `rgba(255,253,248,${0.04 + 0.06 * lit})`,
              opacity: spec * (0.35 + 0.65 * lit),
            }}
          >
            <div
              style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1.5, color: color.emberSoft }}
            >
              {field}
            </div>
            {/* One line: the longest address only fits the field at this size. */}
            <div
              style={{ fontFamily: fonts.mono, fontSize: 21, marginTop: 10, whiteSpace: "nowrap" }}
            >
              {value}
            </div>
          </div>
        );
      })}
      {(Object.keys(records) as (keyof typeof records)[]).map((key) => {
        const { type, title, note, tone, y, cue } = records[key];
        const p = ease(frame, cues[cue] + 10);
        return (
          <div
            key={key}
            style={{
              boxSizing: "border-box",
              position: "absolute",
              left: CARD.x,
              top: y,
              width: CARD.w,
              height: CARD.h,
              padding: "20px 28px",
              background: color.card,
              border: `1px solid ${color.line}`,
              borderRadius: 16,
              boxShadow: "0 8px 24px rgba(34,26,19,0.04)",
              opacity: p,
              translate: `${(1 - p) * 16}px 0`,
            }}
          >
            <div
              style={{
                fontSize: 19,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: tone,
              }}
            >
              {type}
            </div>
            <div style={{ fontFamily: fonts.display, fontSize: 32, marginTop: 4 }}>{title}</div>
            <div style={{ fontFamily: fonts.mono, fontSize: 22, color: color.muted, marginTop: 4 }}>
              {note}
            </div>
          </div>
        );
      })}
    </div>
  );
}
