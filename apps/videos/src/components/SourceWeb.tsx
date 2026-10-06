import { Easing, interpolate, useCurrentFrame } from "remotion";
import { color, fonts } from "../theme";

const W = 340;
const H = 118;

// Six places the design system lives, laid out loosely so the links between them tangle.
const nodes = {
  figma: { title: "Figma", note: "Visual decisions", tone: color.ember, x: 60, y: 40 },
  code: { title: "Code", note: "Behavior and states", tone: color.sage, x: 680, y: 0 },
  docs: { title: "Documentation", note: "Usage guidance", tone: color.sky, x: 1300, y: 70 },
  head: { title: "Someone's head", note: "The reasons why", tone: color.rustDeep, x: 690, y: 300 },
  team: { title: "Team chat", note: "Exceptions and context", tone: color.slate, x: 0, y: 470 },
  past: { title: "Past decisions", note: "What was tried", tone: color.faint, x: 1320, y: 500 },
};
type Id = keyof typeof nodes;

const edges: [Id, Id, number][] = [
  ["figma", "code", 60],
  ["figma", "head", -50],
  ["code", "docs", -40],
  ["figma", "team", 70],
  ["code", "head", 40],
  ["docs", "head", 60],
  ["team", "head", -40],
  ["docs", "past", -70],
  ["past", "head", 50],
  ["team", "code", -60],
  ["team", "past", 90],
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (frame: number, start: number, length = 18) =>
  interpolate(frame, [start, start + length], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

const center = (id: Id) => [nodes[id].x + W / 2, nodes[id].y + H / 2];

/** Curved link from a to b, bent sideways by `bend` pixels so the web reads as hand drawn. */
function link(a: Id, b: Id, bend: number) {
  const [x1, y1] = center(a);
  const [x2, y2] = center(b);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const cx = (x1 + x2) / 2 + (-(y2 - y1) / len) * bend;
  const cy = (y1 + y2) / 2 + ((x2 - x1) / len) * bend;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

/**
 * Many sources of truth, all loosely linked. Nodes and links draw in, then the sources the
 * narration names are lifted out on their cue frames.
 */
export function SourceWeb({ cues }: { cues: Partial<Record<Id, number>> }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "relative", width: 1680, height: 620, marginTop: 56 }}>
      <svg
        width="1680"
        height="620"
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {edges.map(([a, b, bend], i) => (
          <path
            key={`${a}-${b}`}
            d={link(a, b, bend)}
            fill="none"
            stroke={color.line}
            strokeWidth={3}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - ease(frame, 18 + i * 5, 26)}
          />
        ))}
      </svg>
      {(Object.keys(nodes) as Id[]).map((id, i) => {
        const { title, note, tone, x, y } = nodes[id];
        const enter = ease(frame, 4 + i * 5);
        const cue = cues[id];
        const lift = cue === undefined ? 0 : ease(frame, cue - 4, 12);
        return (
          <div
            key={id}
            style={{
              boxSizing: "border-box",
              position: "absolute",
              left: x,
              top: y,
              width: W,
              height: H,
              padding: "22px 28px",
              background: color.card,
              borderRadius: 16,
              border: `2px solid ${color.line}`,
              borderColor: lift > 0.5 ? tone : color.line,
              boxShadow: `0 ${8 + lift * 10}px ${24 + lift * 16}px rgba(34,26,19,${0.035 + lift * 0.06})`,
              opacity: enter,
              translate: `0 ${(1 - enter) * 14}px`,
              scale: `${1 + lift * 0.05}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: 12, background: tone }} />
              <div style={{ fontFamily: fonts.display, fontSize: 34 }}>{title}</div>
            </div>
            <div style={{ fontSize: 26, marginTop: 8, color: color.muted }}>{note}</div>
          </div>
        );
      })}
    </div>
  );
}
