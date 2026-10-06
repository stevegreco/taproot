import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../components/Scene";
import { Badge, ProjectCard } from "../components/ProjectCard";
import { SourceWeb } from "../components/SourceWeb";
import { LinkGraph } from "../components/LinkGraph";
import { SpecSheet } from "../components/SpecSheet";
import { color, fonts } from "../theme";

import { PHASE, SHIFT_CUES } from "../timeline";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function progress(frame: number, start: number, length = 20) {
  return interpolate(frame, [start, start + length], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
}

// Each rule the first attempt breaks, numbered to match the marks on the card. Statements are
// abridged from component.button; the third points on to the pattern it applies.
const rules = [
  ["MUST", "danger-for-destructive", "Use danger only for destructive actions.", ""],
  ["MUST", "label-describes-result", "Use a concise label that describes the result.", ""],
  [
    "SHOULD",
    "follow-action-hierarchy",
    "Apply the action hierarchy pattern.",
    "pattern.action-hierarchy",
  ],
] as const;

/** Each chapter shares a grid and crossfades in place. No cards cross other text. */
function Chapter({
  from,
  to,
  number,
  name,
  title,
  children,
}: {
  from: number;
  to: number;
  number: string;
  name: string;
  title: string;
  children: ReactNode;
}) {
  const frame = useCurrentFrame();
  const enter = progress(frame, from, 18);
  const leave = progress(frame, to - 12, 18);
  if (frame < from || frame > to + 6) return null;
  return (
    <AbsoluteFill
      style={{
        padding: "90px 120px",
        opacity: enter * (1 - leave),
        transform: `translateY(${(1 - enter) * 16 - leave * 8}px)`,
      }}
    >
      <div
        style={{
          fontSize: 24,
          color: color.emberDeep,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {number} / {name}
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 66, lineHeight: 1.15, marginTop: 16 }}>
        {title}
      </div>
      {children}
    </AbsoluteFill>
  );
}

function Card({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        background: color.card,
        border: `1px solid ${color.line}`,
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

export function Shift() {
  const frame = useCurrentFrame();
  const rule = (i: number) => progress(frame, PHASE.rules + 24 + i * 36);
  const levels = progress(frame, SHIFT_CUES.levels - 4, 12);
  return (
    <Scene>
      <Chapter
        from={0}
        to={PHASE.agent}
        number="01"
        name="Scattered"
        title="The answers are scattered."
      >
        <SourceWeb
          cues={{ figma: SHIFT_CUES.figma, code: SHIFT_CUES.code, head: SHIFT_CUES.head }}
        />
      </Chapter>
      <Chapter
        from={PHASE.agent - 6}
        to={PHASE.spec}
        number="02"
        name="The gap"
        title="A plausible answer can still be wrong."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 72,
            marginTop: 96,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 24,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: color.faint,
              }}
            >
              The request
            </div>
            <div
              style={{ fontFamily: fonts.display, fontSize: 54, lineHeight: 1.25, marginTop: 20 }}
            >
              “Add an action to
              <br />
              delete this project.”
            </div>
            <div
              style={{
                opacity: progress(frame, PHASE.agent + 75),
                fontSize: 30,
                marginTop: 38,
                color: color.rustDeep,
              }}
            >
              It looks right. It misses the point.
            </div>
          </div>
          <ProjectCard style={{ opacity: progress(frame, PHASE.agent + 30) }} />
        </div>
      </Chapter>
      <Chapter
        from={PHASE.spec - 6}
        to={PHASE.links}
        number="03"
        name="The contract"
        title="Write the contract once."
      >
        <SpecSheet cues={SHIFT_CUES} />
      </Chapter>
      <Chapter
        from={PHASE.links - 6}
        to={PHASE.rules}
        number="04"
        name="Links"
        title="The reasons travel with the rules."
      >
        <LinkGraph cues={{ ...SHIFT_CUES, start: PHASE.links + 10 }} />
      </Chapter>
      <Chapter
        from={PHASE.rules - 6}
        to={PHASE.validate}
        number="05"
        name="Addresses"
        title="Give every rule an address."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.15fr",
            gap: 64,
            marginTop: 80,
            alignItems: "center",
          }}
        >
          <ProjectCard marks={[rule(0), rule(1), rule(2)]} />
          <Card
            style={{
              background: color.ink,
              color: color.paper,
              borderColor: color.ink,
              padding: "38px 44px",
            }}
          >
            <div
              style={{
                color: color.emberSoft,
                textTransform: "uppercase",
                letterSpacing: 2,
                fontSize: 23,
              }}
            >
              component.button
            </div>
            {rules.map(([level, id, value, follows], i) => (
              <div
                key={id}
                style={{
                  opacity: rule(i),
                  display: "grid",
                  gridTemplateColumns: "54px 120px 1fr",
                  gap: 16,
                  padding: "22px 0",
                  borderBottom: i < 2 ? "1px solid rgba(255,253,248,.15)" : undefined,
                }}
              >
                <div style={{ position: "relative" }}>
                  <Badge n={i + 1} p={1} />
                </div>
                <div
                  style={{
                    fontSize: 25,
                    color: color.emberSoft,
                    fontWeight: 700,
                    paddingTop: 4,
                    opacity: 0.45 + 0.55 * levels,
                  }}
                >
                  {level}
                </div>
                <div>
                  <div style={{ fontSize: 29 }}>{value}</div>
                  <div
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 22,
                      color: color.line,
                      marginTop: 6,
                    }}
                  >
                    #{id}
                    {follows && <div style={{ color: color.emberSoft }}>→ {follows}</div>}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </Chapter>
      <Chapter
        from={PHASE.validate - 6}
        to={PHASE.end}
        number="06"
        name="Checks"
        title="Checked, so it stays true."
      >
        <Validation frame={frame} />
      </Chapter>
    </Scene>
  );
}

// The cross-record checks from SPEC.md, ticked off as the narration names them.
const checks = [
  "Every link and reference resolves to a record or section",
  "Every default and example is one of its parameter's values",
  "Every token part is an anatomy part",
  "Every ID is unique",
];

function Validation({ frame }: { frame: number }) {
  const start = SHIFT_CUES.checked;
  return (
    <Card
      style={{
        marginTop: 80,
        background: color.ink,
        color: color.paper,
        borderColor: color.ink,
        padding: "40px 48px",
        fontFamily: fonts.mono,
        fontSize: 27,
      }}
    >
      <div style={{ color: color.line, opacity: progress(frame, PHASE.validate + 10, 12) }}>
        $ ds-spec validate
      </div>
      {checks.map((check, i) => {
        const p = progress(frame, start - 6 + i * 12, 12);
        return (
          <div key={check} style={{ marginTop: 20, opacity: p, display: "flex", gap: 18 }}>
            <span style={{ color: color.sageSoft }}>✓</span>
            {check}
          </div>
        );
      })}
      <div
        style={{
          marginTop: 30,
          color: color.sageSoft,
          fontWeight: 600,
          opacity: progress(frame, start + 48, 12),
        }}
      >
        OK: 14 records, no issues.
      </div>
    </Card>
  );
}
