import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../components/Scene";
import { UiButton } from "../components/UiButton";
import { color, fonts } from "../theme";

export const PHASE = { before: 0, agent: 210, center: 360, reverse: 600, end: 810 };
export const SHIFT_DURATION = PHASE.end;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function progress(frame: number, start: number, length = 20) {
  return interpolate(frame, [start, start + length], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
}

const sources = [
  ["01", "Figma", "Visual decisions", color.ember],
  ["02", "Code", "Behavior and states", color.sage],
  ["03", "Documentation", "Usage guidance", color.sky],
  ["04", "Team conversations", "Exceptions and context", color.slate],
  ["05", "Past decisions", "The reasons why", color.rustDeep],
  ["06", "People", "How it all fits together", color.faint],
];

/** Each chapter shares a grid and crossfades in place. No cards cross other text. */
function Chapter({
  from,
  to,
  number,
  title,
  subtitle,
  children,
}: {
  from: number;
  to: number;
  number: string;
  title: string;
  subtitle: string;
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
        {number} / The design system spec
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 66, lineHeight: 1.15, marginTop: 16 }}>
        {title}
      </div>
      <div style={{ fontSize: 34, lineHeight: 1.4, color: color.muted, marginTop: 22 }}>
        {subtitle}
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
  return (
    <Scene>
      <Chapter
        from={0}
        to={PHASE.agent}
        number="01"
        title="The answers are scattered."
        subtitle="Every source holds a different part of the design system."
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 72 }}
        >
          {sources.map(([n, title, note, tone], i) => {
            const p = progress(frame, 16 + i * 8);
            return (
              <Card
                key={n}
                style={{ opacity: p, transform: `translateY(${(1 - p) * 18}px)`, height: 190 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 10, background: tone }} />
                  <div style={{ fontFamily: fonts.display, fontSize: 35 }}>{title}</div>
                </div>
                <div style={{ fontSize: 28, marginTop: 18, color: color.muted }}>{note}</div>
              </Card>
            );
          })}
        </div>
        <div
          style={{ opacity: progress(frame, 105), marginTop: 38, fontSize: 30, color: color.muted }}
        >
          People connect the dots. Agents guess.
        </div>
      </Chapter>
      <Chapter
        from={PHASE.agent - 6}
        to={PHASE.center}
        number="02"
        title="A plausible answer can still be wrong."
        subtitle="The agent sees the button. It misses the rules behind it."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 72,
            marginTop: 78,
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
                opacity: progress(frame, PHASE.agent + 45),
                fontSize: 30,
                marginTop: 38,
                color: color.rustDeep,
              }}
            >
              Missing: intent, emphasis, placement.
            </div>
          </div>
          <Card style={{ padding: 48 }}>
            <div style={{ fontFamily: fonts.display, fontSize: 40 }}>Project settings</div>
            <div style={{ marginTop: 32, paddingTop: 32, borderTop: `1px solid ${color.line}` }}>
              <UiButton variant="primary" label="Remove" scale={1.2} />
            </div>
            <div
              style={{
                opacity: progress(frame, PHASE.agent + 65),
                marginTop: 30,
                color: color.rustDeep,
                fontSize: 28,
              }}
            >
              An unclear label. The wrong emphasis.
            </div>
          </Card>
        </div>
      </Chapter>
      <Chapter
        from={PHASE.center - 6}
        to={PHASE.reverse}
        number="03"
        title="Make the rules explicit."
        subtitle="Write the rules down once, in a form people and agents can both read."
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.8fr 1.2fr",
            gap: 80,
            marginTop: 64,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontFamily: fonts.display, fontSize: 48, lineHeight: 1.25 }}>
              Rules with
              <br />
              an address.
            </div>
            <div
              style={{
                fontSize: 30,
                color: color.muted,
                lineHeight: 1.5,
                marginTop: 28,
                maxWidth: 520,
              }}
            >
              Each rule has an ID
              <br />
              and a level, so every
              <br />
              answer can be cited.
            </div>
          </div>
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
            {[
              ["MUST", "danger-for-destructive", "Use danger only for destructive actions"],
              ["MUST", "label-describes-result", "Name the result: Delete project"],
              ["SHOULD", "follow-action-hierarchy", "Separate it from routine actions"],
            ].map(([level, id, value], i) => (
              <div
                key={id}
                style={{
                  opacity: progress(frame, PHASE.center + 18 + i * 34),
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
                  gap: 24,
                  padding: "22px 0",
                  borderBottom: i < 2 ? "1px solid rgba(255,253,248,.15)" : undefined,
                }}
              >
                <div style={{ fontSize: 25, color: color.emberSoft, fontWeight: 700, paddingTop: 4 }}>
                  {level}
                </div>
                <div>
                  <div style={{ fontSize: 29 }}>{value}</div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 22, color: color.line, marginTop: 6 }}>
                    #{id}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </Chapter>
      <Chapter
        from={PHASE.reverse - 6}
        to={PHASE.end + 12}
        number="04"
        title="A common reference for every output."
        subtitle="Design, code, docs, and agents all read the same spec."
      >
        <div style={{ position: "relative", marginTop: 56, height: 510 }}>
          <svg width="1680" height="510" style={{ position: "absolute", inset: 0 }}>
            {[60, 185, 310, 435].map((y, i) => (
              <path
                key={y}
                d={`M 640 255 C 830 255, 810 ${y}, 960 ${y}`}
                fill="none"
                stroke={color.line}
                strokeWidth={3}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - progress(frame, PHASE.reverse + 15 + i * 25, 30)}
              />
            ))}
          </svg>
          <Card
            style={{
              position: "absolute",
              left: 0,
              top: 132,
              width: 640,
              height: 246,
              background: color.ink,
              color: color.paper,
              borderColor: color.ink,
            }}
          >
            <div
              style={{
                fontSize: 23,
                color: color.emberSoft,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Shared contract
            </div>
            <div style={{ fontFamily: fonts.display, fontSize: 46, marginTop: 18 }}>
              The design system spec
            </div>
            <div style={{ fontSize: 28, color: color.line, marginTop: 16 }}>
              Components · rules · tokens
            </div>
          </Card>
          {[
            ["Design tools", "Visual decisions"],
            ["Component libraries", "Platform behavior"],
            ["Documentation", "Usage and examples"],
            ["Agents", "Exact answers over MCP and CLI"],
          ].map(([title, note], i) => (
            <Card
              key={title}
              style={{
                position: "absolute",
                left: 960,
                top: i * 125,
                width: 720,
                height: 116,
                padding: "22px 30px",
                opacity: progress(frame, PHASE.reverse + 25 + i * 25),
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 600 }}>{title}</div>
              <div style={{ fontSize: 26, color: color.muted, marginTop: 4 }}>{note}</div>
            </Card>
          ))}
        </div>
      </Chapter>
    </Scene>
  );
}
