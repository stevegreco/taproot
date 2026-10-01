import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Heading } from "../components/Heading";
import { Scene } from "../components/Scene";
import { pop, rise, useEnter, useProgress } from "../components/motion";
import { color, fonts } from "../theme";

const TOP = 330;

const outputs = [
  {
    y: TOP,
    title: "Command line",
    who: "People and agents ask from the terminal.",
    tone: color.ember,
    delay: 100,
  },
  {
    y: TOP + 205,
    title: "AI connector (MCP)",
    who: "AI assistants, like Claude, ask it directly.",
    tone: color.sage,
    delay: 120,
  },
  {
    y: TOP + 410,
    title: "Documentation site",
    who: "Everyone reads the same guidance on the web.",
    tone: color.sky,
    delay: 140,
  },
];

export function Architecture() {
  const source = useEnter(10);
  const hub = useEnter(40);
  const footer = useEnter(190);
  return (
    <Scene>
      <Heading eyebrow="Distribute it" title="One library. Every tool reads it." width={1700} />
      <AbsoluteFill>
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          <Flow x1={560} y1={TOP + 290} x2={730} y2={TOP + 290} start={30} />
          {outputs.map((o) => (
            <Flow
              key={o.title}
              x1={1190}
              y1={TOP + 290}
              x2={1290}
              y2={o.y + 85}
              start={o.delay - 15}
            />
          ))}
        </svg>

        <Box x={120} y={TOP} w={440} h={580} p={source} bg={color.card} border={color.line}>
          <Label>Written by the team</Label>
          <div style={{ fontFamily: fonts.display, fontSize: 40, fontWeight: 600, marginTop: 8 }}>
            Plain text files
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
            {[
              "button.spec.yaml",
              "link.spec.yaml",
              "action-hierarchy.md",
              "compose-or-propose.md",
            ].map((f) => (
              <div
                key={f}
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 22,
                  background: color.paper,
                  border: `2px solid ${color.line}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                }}
              >
                {f}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 26, color: color.muted, marginTop: 26, lineHeight: 1.35 }}>
            Reviewed and changed like any shared document.
          </div>
        </Box>

        <Box x={730} y={TOP + 60} w={460} h={460} p={hub} bg={color.ink} border={color.ink}>
          <div style={{ color: color.paper }}>
            <Label tone={color.emberSoft}>The core</Label>
            <div style={{ fontFamily: fonts.display, fontSize: 46, fontWeight: 500, marginTop: 8 }}>
              Knowledge library
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 34 }}>
              <Step n="1" text="Checks every file" delay={58} />
              <Step n="2" text="Links related records" delay={70} />
              <Step n="3" text="Answers questions" delay={82} />
            </div>
          </div>
        </Box>

        {outputs.map((o) => (
          <Output key={o.title} {...o} />
        ))}

        <div
          style={{
            ...rise(footer, 20),
            position: "absolute",
            left: 120,
            right: 120,
            bottom: 40,
            textAlign: "center",
            fontSize: 30,
            color: color.muted,
          }}
        >
          No copying, no separate versions. When the library changes, every channel sees it.
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

function Box({
  x,
  y,
  w,
  h,
  p,
  bg,
  border,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  p: number;
  bg: string;
  border: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        ...pop(p),
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: 26,
        padding: "32px 34px",
        boxShadow: "0 20px 50px rgba(34,26,19,0.10)",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children, tone = color.emberDeep }: { children: ReactNode; tone?: string }) {
  return (
    <div
      style={{
        fontSize: 21,
        fontWeight: 700,
        letterSpacing: 2.5,
        textTransform: "uppercase",
        color: tone,
      }}
    >
      {children}
    </div>
  );
}

function Step({ n, text, delay }: { n: string; text: string; delay: number }) {
  const p = useEnter(delay);
  return (
    <div style={{ ...rise(p, 12), display: "flex", alignItems: "center", gap: 18, fontSize: 31 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: color.ember,
          color: color.ink,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
        }}
      >
        {n}
      </div>
      {text}
    </div>
  );
}

function Output({ y, title, who, tone, delay }: (typeof outputs)[number]) {
  const p = useEnter(delay);
  return (
    <div
      style={{
        ...rise(p, 20),
        position: "absolute",
        left: 1290,
        top: y,
        width: 510,
        height: 170,
        background: color.card,
        border: `2px solid ${color.line}`,
        borderLeft: `12px solid ${tone}`,
        borderRadius: 20,
        padding: "24px 28px",
      }}
    >
      <div style={{ fontFamily: fonts.display, fontSize: 36, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 26, color: color.muted, marginTop: 8, lineHeight: 1.3 }}>{who}</div>
    </div>
  );
}

/** A connector that draws in, then carries a stream of dots from source to target. */
function Flow({
  x1,
  y1,
  x2,
  y2,
  start,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  start: number;
}) {
  const frame = useCurrentFrame();
  const draw = useProgress(start, start + 20);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const dots = frame > start + 30 ? [0, 1, 2] : [];
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color.faint}
        strokeWidth={3}
        strokeDasharray={len}
        strokeDashoffset={len * (1 - draw)}
      />
      {dots.map((i) => {
        const t = ((((frame - start) / 45 + i / 3) % 1) + 1) % 1;
        return (
          <circle
            key={i}
            cx={x1 + (x2 - x1) * t}
            cy={y1 + (y2 - y1) * t}
            r={7}
            fill={color.ember}
          />
        );
      })}
    </g>
  );
}
