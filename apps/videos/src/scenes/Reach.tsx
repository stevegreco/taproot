import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Chapter } from "../components/Chapter";
import { Badge } from "../components/ProjectCard";
import { color, fonts } from "../theme";
import { SCENES } from "../timeline";

const REACH_CUES = SCENES.reach.cues;

const rules = [
  ["MUST", "danger-for-destructive"],
  ["MUST", "label-describes-result"],
  ["SHOULD", "follow-action-hierarchy"],
];

// Each output receives the rules as the narration names it. Design and code build from the
// contract; docs and agents read it.
const outputs = [
  ["Design tools", "Visual decisions", REACH_CUES.design, "Builds from"],
  ["Component libraries", "Platform behavior", REACH_CUES.libraries, "Builds from"],
  ["Documentation", "Usage and examples", REACH_CUES.docs, "Reads"],
  ["Agents", "Exact answers over MCP and CLI", REACH_CUES.agents, "Reads"],
] as const;

const SPEC = { x: 640, y: 270 };
const OUT_X = 960;
const outY = (i: number) => 58 + i * 130;
const TRAVEL = 14;

function progress(frame: number, start: number, length = 20) {
  return interpolate(frame, [start, start + length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
}

/** Point `t` along the cubic link from the spec to output `i`; matches the drawn path. */
function along(i: number, t: number) {
  const y = outY(i);
  const pts = [
    [SPEC.x, SPEC.y],
    [830, SPEC.y],
    [810, y],
    [OUT_X, y],
  ];
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [0, 1].map((k) => pts.reduce((sum, p, j) => sum + p[k] * w[j], 0));
}

const card = {
  boxSizing: "border-box",
  position: "absolute",
  border: `1px solid ${color.line}`,
  borderRadius: 16,
  boxShadow: "0 8px 24px rgba(34,26,19,0.035)",
} as const;

// After the payoff: the rules the agent cited travel from the spec to every output.
export function Reach() {
  const frame = useCurrentFrame();
  return (
    <Chapter number="09" name="One source" title="One source for every output.">
      <div style={{ position: "relative", height: 560 }}>
        <svg width="1680" height="560" style={{ position: "absolute", inset: 0 }}>
          {outputs.map(([title, , cue], i) => (
            <path
              key={title}
              d={`M ${SPEC.x} ${SPEC.y} C 830 ${SPEC.y}, 810 ${outY(i)}, ${OUT_X} ${outY(i)}`}
              fill="none"
              stroke={progress(frame, cue + 6, 12) > 0.5 ? color.sage : color.line}
              strokeWidth={3}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - progress(frame, cue - 18, 14)}
            />
          ))}
          {outputs.flatMap(([title, , cue], i) =>
            rules.map((_, r) => {
              const t = progress(frame, cue - 8 + r * 4, TRAVEL);
              if (t <= 0 || t >= 1) return null;
              const [x, y] = along(i, t);
              return <circle key={`${title}-${r}`} cx={x} cy={y} r={9} fill={color.sage} />;
            }),
          )}
        </svg>
        <div
          style={{
            ...card,
            left: 0,
            top: SPEC.y - 170,
            width: 640,
            height: 340,
            padding: "32px 36px",
            background: color.ink,
            color: color.paper,
            borderColor: color.ink,
          }}
        >
          <div style={{ fontFamily: fonts.display, fontSize: 42 }}>The design system spec</div>
          {rules.map(([level, id], r) => (
            <div
              key={id}
              style={{
                display: "grid",
                gridTemplateColumns: "54px 110px 1fr",
                alignItems: "center",
                marginTop: r ? 18 : 30,
                opacity: progress(frame, 6 + r * 6, 14),
              }}
            >
              <div style={{ position: "relative", height: 38 }}>
                <Badge n={r + 1} p={1} tone={color.sage} />
              </div>
              <div style={{ fontSize: 23, fontWeight: 700, color: color.emberSoft }}>{level}</div>
              <div style={{ fontFamily: fonts.mono, fontSize: 24, color: color.line }}>#{id}</div>
            </div>
          ))}
        </div>
        {outputs.map(([title, note, cue, relation], i) => {
          const lit = progress(frame, cue - 18, 10);
          return (
            <div
              key={title}
              style={{
                ...card,
                left: OUT_X,
                top: outY(i) - 58,
                width: 720,
                height: 116,
                padding: "22px 30px",
                background: color.card,
                opacity: 0.3 + 0.7 * lit,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 32, fontWeight: 600 }}>{title}</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: relation === "Reads" ? color.sky : color.sage,
                    background: relation === "Reads" ? color.skySoft : color.sageSoft,
                    borderRadius: 999,
                    padding: "4px 12px",
                  }}
                >
                  {relation}
                </div>
              </div>
              <div style={{ fontSize: 26, color: color.muted, marginTop: 4 }}>{note}</div>
              {rules.map((_, r) => {
                const arrived = progress(frame, cue - 8 + r * 4 + TRAVEL, 6);
                return (
                  <Badge
                    key={r}
                    n={r + 1}
                    p={arrived}
                    tone={color.sage}
                    style={{ right: 30 + (2 - r) * 46, top: 39 }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </Chapter>
  );
}
