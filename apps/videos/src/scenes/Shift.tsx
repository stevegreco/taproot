import type { ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../components/Scene";
import { UiButton } from "../components/UiButton";
import { pop, useEnter } from "../components/motion";
import { color, fonts } from "../theme";

// One continuous scene in four phases, so the same boxes visibly rearrange:
// many sources of truth -> an agent guesses -> knowledge moves to the center -> the arrows reverse.
export const PHASE = { before: 0, agent: 360, center: 570, reverse: 870, end: 1230 };
export const SHIFT_DURATION = PHASE.end;

const W = 430;
const H = 130;

type Node = {
  id: string;
  before: { title: string; note: string; at: [number, number] };
  /** Where the node goes once it reads from the knowledge layer. Missing: it is absorbed. */
  after?: { title: string; note: string; at: [number, number] };
  tone: string;
};

const nodes: Node[] = [
  {
    id: "figma",
    tone: color.rust,
    before: { title: "Figma", note: "Has the visuals", at: [330, 450] },
    after: { title: "Design tools", note: "Figma components built from it", at: [1450, 400] },
  },
  {
    id: "code",
    tone: color.ember,
    before: { title: "Code", note: "Has the behavior", at: [860, 400] },
    after: {
      title: "Component libraries",
      note: "Web, iOS, Android implement it",
      at: [1450, 560],
    },
  },
  {
    id: "docs",
    tone: color.sky,
    before: { title: "Docs site", note: "Has the usage, if current", at: [1450, 450] },
    after: { title: "Documentation", note: "Pages generated from it", at: [1450, 720] },
  },
  {
    id: "wiki",
    tone: color.faint,
    before: { title: "Wiki", note: "Has old decisions", at: [1560, 790] },
  },
  {
    id: "slack",
    tone: color.slate,
    before: { title: "Slack", note: "Has the exceptions", at: [980, 830] },
  },
  {
    id: "heads",
    tone: color.emberDeep,
    before: { title: "People's heads", note: "Have the why", at: [420, 820] },
  },
];

const agentContext = {
  title: "Agent context",
  note: "MCP and CLI answer agents",
  at: [1450, 880] as [number, number],
};

const tangle: [string, string][] = [
  ["figma", "code"],
  ["code", "docs"],
  ["docs", "wiki"],
  ["wiki", "slack"],
  ["slack", "heads"],
  ["heads", "figma"],
  ["figma", "docs"],
  ["code", "slack"],
  ["heads", "docs"],
];

const HUB_CENTER: [number, number] = [940, 720];
const HUB_LEFT: [number, number] = [540, 680];
const HUB_W = 640;
const HUB_H = 450;

const ease = Easing.inOut(Easing.cubic);
function useT(from: number, to: number) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Opacity that is 1 inside [from, to] and fades over `fade` frames at each end. */
function useWindow(from: number, to: number, fade = 15) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, from + fade, to - fade, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function Shift() {
  return (
    <Scene>
      <Titles />
      <AbsoluteFill>
        <Tangle />
        <Spokes />
        <Hub />
        {nodes.map((node, i) => (
          <SourceNode key={node.id} node={node} index={i} />
        ))}
        <AgentContextNode />
        <Agent />
      </AbsoluteFill>
    </Scene>
  );
}

// --- Titles: one per phase, crossfading in place ---

const titles = [
  {
    from: PHASE.before,
    to: PHASE.agent,
    eyebrow: "Today",
    title: "Many sources of truth.",
    lede: "Each holds part of the picture. People reconcile them by hand.",
  },
  {
    from: PHASE.agent,
    to: PHASE.center,
    eyebrow: "The shift",
    title: "Agents don't know who to ask.",
    lede: "They read literally, and only what they can reach.",
  },
  {
    from: PHASE.center,
    to: PHASE.reverse,
    eyebrow: "The knowledge layer",
    title: "Move the knowledge to the center.",
    lede: "Contracts say what each component is. Guidance says how to use them together.",
  },
  {
    from: PHASE.reverse,
    to: PHASE.end + 20,
    eyebrow: "Built from it",
    title: "One source. Everything else is built from it.",
    lede: "Change it once, and every output follows.",
  },
];

function Titles() {
  return (
    <>
      {titles.map((t) => (
        <PhaseTitle key={t.title} {...t} />
      ))}
    </>
  );
}

function PhaseTitle({ from, to, eyebrow, title, lede }: (typeof titles)[number]) {
  const opacity = useWindow(from, to);
  const rise = useT(from, from + 20);
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        top: 90,
        maxWidth: 1700,
        opacity,
        transform: `translateY(${(1 - rise) * 20}px)`,
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: color.emberDeep,
          marginBottom: 14,
        }}
      >
        {eyebrow}
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 64, fontWeight: 500, lineHeight: 1.12 }}>
        {title}
      </div>
      <div style={{ fontSize: 32, color: color.muted, marginTop: 16 }}>{lede}</div>
    </div>
  );
}

// --- Nodes ---

function position(node: Node, toCenter: number, reverse: number): [number, number] {
  const [bx, by] = node.before.at;
  if (!node.after) {
    // Absorbed: drift into the hub as the knowledge moves to the center.
    return [lerp(bx, HUB_CENTER[0], toCenter), lerp(by, HUB_CENTER[1], toCenter)];
  }
  const [ax, ay] = node.after.at;
  return [lerp(bx, ax, reverse), lerp(by, ay, reverse)];
}

function SourceNode({ node, index }: { node: Node; index: number }) {
  const frame = useCurrentFrame();
  const enter = useEnter(20 + index * 12);
  const absorb = useT(PHASE.center + 10, PHASE.center + 110);
  // Outputs move one at a time, last first (Docs, then Code, then Figma), so each card flies
  // through space the previous one has already cleared.
  const stagger = (2 - index) * 22;
  const reverse = useT(PHASE.reverse + stagger, PHASE.reverse + stagger + 60);
  const relabel = useT(PHASE.reverse + stagger + 15, PHASE.reverse + stagger + 45);
  // Sources dim while the agent searches them and while the knowledge moves out of them.
  const dim = interpolate(
    frame,
    [
      PHASE.agent,
      PHASE.agent + 20,
      PHASE.center,
      PHASE.center + 30,
      PHASE.reverse,
      PHASE.reverse + 30,
    ],
    [1, 0.55, 0.55, 0.45, 0.45, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  // The agent reads Figma, the one source it can reach.
  const readWindow = useWindow(PHASE.agent + 70, PHASE.agent + 150, 10);
  const reading = node.id === "figma" ? readWindow : 0;
  const [x, y] = position(node, node.after ? 0 : absorb, reverse);
  const absorbedOpacity = node.after ? 1 : 1 - absorb;
  const tilt = node.after
    ? [-2, 2, -1][index] * (1 - reverse)
    : [2, -2, 1][index - 3] * (1 - absorb);
  const scale = node.after ? 1 : 1 - 0.5 * absorb;

  return (
    <div
      style={{
        position: "absolute",
        left: x - W / 2,
        top: y - H / 2,
        width: W,
        height: H,
        opacity: pop(enter).opacity * absorbedOpacity,
        transform: `${pop(enter).transform} rotate(${tilt}deg) scale(${scale})`,
        background: color.card,
        border: `2px solid ${reading > 0 ? color.sky : color.line}`,
        borderLeft: `12px solid ${node.tone}`,
        borderRadius: 18,
        padding: "20px 26px",
        boxShadow: `0 14px 34px rgba(34,26,19,0.08)${reading > 0 ? `, 0 0 0 ${8 * reading}px ${color.skySoft}` : ""}`,
      }}
    >
      {/* Dim the content, not the card, so the links behind it stay hidden. */}
      <div style={{ opacity: Math.max(dim, reading) }}>
        <Swap t={node.after ? relabel : 0}>
          {[
            <Label key="b" title={node.before.title} note={node.before.note} />,
            node.after && <Label key="a" title={node.after.title} note={node.after.note} />,
          ]}
        </Swap>
      </div>
    </div>
  );
}

function AgentContextNode() {
  const p = useEnter(PHASE.reverse + 125);
  const [x, y] = agentContext.at;
  const frame = useCurrentFrame();
  if (frame < PHASE.reverse + 125) return null;
  return (
    <div
      style={{
        ...pop(p),
        position: "absolute",
        left: x - W / 2,
        top: y - H / 2,
        width: W,
        height: H,
        background: color.card,
        border: `2px solid ${color.line}`,
        borderLeft: `12px solid ${color.sage}`,
        borderRadius: 18,
        padding: "20px 26px",
        boxShadow: "0 14px 34px rgba(34,26,19,0.08)",
      }}
    >
      <Label title={agentContext.title} note={agentContext.note} />
    </div>
  );
}

function Label({ title, note }: { title: string; note: string }) {
  return (
    <div>
      <div style={{ fontFamily: fonts.display, fontSize: 31, fontWeight: 600, lineHeight: 1.1 }}>
        {title}
      </div>
      <div style={{ fontSize: 23, color: color.muted, marginTop: 8, lineHeight: 1.25 }}>{note}</div>
    </div>
  );
}

/** Swap two children in the same place: the first fades out before the second fades in. */
function Swap({ t, children }: { t: number; children: [ReactNode, ReactNode] }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ opacity: Math.max(0, 1 - t * 2) }}>{children[0]}</div>
      <div style={{ position: "absolute", inset: 0, opacity: Math.max(0, t * 2 - 1) }}>
        {children[1]}
      </div>
    </div>
  );
}

// --- Tangled links between the sources ---

function Tangle() {
  const draw = useT(110, 190);
  const fade = 1 - useT(PHASE.center, PHASE.center + 40);
  const question = useEnter(200);
  const questionOut = useT(PHASE.agent - 10, PHASE.agent + 10);
  const frame = useCurrentFrame();
  const at = (id: string) => nodes.find((n) => n.id === id)!.before.at;
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: fade }}>
        {tangle.map(([a, b], i) => {
          const [x1, y1] = at(a);
          const [x2, y2] = at(b);
          const len = Math.hypot(x2 - x1, y2 - y1);
          return (
            <line
              key={`${a}-${b}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color.faint}
              strokeWidth={3}
              strokeDasharray={`${len}`}
              strokeDashoffset={len * (1 - Math.min(1, draw * 1.4 - i * 0.05))}
              opacity={0.55}
            />
          );
        })}
      </svg>
      {frame < PHASE.agent + 20 && (
        <div
          style={{
            ...pop(question),
            opacity: pop(question).opacity * (1 - questionOut),
            position: "absolute",
            left: 860 - 230,
            top: 600,
            width: 460,
            whiteSpace: "nowrap",
            textAlign: "center",
            background: color.rustSoft,
            color: color.rustDeep,
            fontFamily: fonts.display,
            fontSize: 38,
            fontWeight: 600,
            borderRadius: 999,
            padding: "14px 24px",
          }}
        >
          Which one is right?
        </div>
      )}
    </>
  );
}

// --- The agent that guesses ---

function Agent() {
  const frame = useCurrentFrame();
  const visible = useWindow(PHASE.agent + 10, PHASE.center + 30);
  const travel = useT(PHASE.agent + 20, PHASE.agent + 70);
  const thought = useEnter(PHASE.agent + 95);
  const wrong = useEnter(PHASE.agent + 140);
  if (frame < PHASE.agent || frame > PHASE.center + 40) return null;
  const x = lerp(120, 330, travel);
  const y = lerp(640, 590, travel);
  return (
    <div style={{ opacity: visible }}>
      <AgentChip x={x} y={y} />
      <div
        style={{
          ...pop(thought),
          position: "absolute",
          left: x - 90,
          top: y + 52,
          background: color.card,
          border: `2px dashed ${color.faint}`,
          borderRadius: 18,
          padding: "12px 20px",
          fontSize: 26,
          color: color.muted,
        }}
      >
        Red? Orange? “Remove” or “Delete”?
      </div>
      <div
        style={{
          ...pop(wrong),
          position: "absolute",
          left: 820,
          top: 500,
          width: 520,
          background: color.card,
          border: `3px dashed ${color.rust}`,
          borderRadius: 22,
          padding: "26px 30px",
          boxShadow: "0 18px 40px rgba(34,26,19,0.10)",
        }}
      >
        <div style={{ fontFamily: fonts.display, fontSize: 34, fontWeight: 600 }}>
          Delete this project
        </div>
        <div style={{ marginTop: 18 }}>
          <UiButton variant="primary" label="Remove" />
        </div>
        <div style={{ marginTop: 16, fontSize: 26, fontWeight: 700, color: color.rustDeep }}>
          Plausible. Wrong.
        </div>
      </div>
    </div>
  );
}

export function AgentChip({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - 90,
        top: y - 30,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: color.ink,
        color: color.paper,
        borderRadius: 999,
        padding: "12px 22px",
        fontSize: 26,
        fontWeight: 700,
      }}
    >
      <div style={{ width: 16, height: 16, borderRadius: 999, background: color.sage }} />
      AI agent
    </div>
  );
}

// --- The knowledge layer ---

function Hub() {
  const frame = useCurrentFrame();
  const enter = useEnter(PHASE.center + 70);
  // Slide left only once the Figma card has left that space.
  const move = useT(PHASE.reverse + 70, PHASE.reverse + 125);
  if (frame < PHASE.center + 60) return null;
  const x = lerp(HUB_CENTER[0], HUB_LEFT[0], move);
  const y = lerp(HUB_CENTER[1], HUB_LEFT[1], move);
  const w = HUB_W;
  const h = HUB_H;
  return (
    <div
      style={{
        ...pop(enter),
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        background: color.ink,
        color: color.paper,
        borderRadius: 28,
        padding: "32px 36px",
        boxShadow: "0 24px 60px rgba(34,26,19,0.18)",
      }}
    >
      <div
        style={{
          fontSize: 21,
          fontWeight: 700,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          color: color.emberSoft,
        }}
      >
        One source of truth
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 48, fontWeight: 500, marginTop: 4 }}>
        Knowledge layer
      </div>
      <div style={{ display: "flex", gap: 24, marginTop: 26 }}>
        <HubColumn
          title="Component contracts"
          tone={color.ember}
          items={["What it's for", "Options and states", "Rules: must, should", "Design tokens"]}
          delay={PHASE.center + 110}
        />
        <HubColumn
          title="Guidance"
          tone={color.sage}
          items={["Patterns", "Guidelines", "Examples"]}
          delay={PHASE.center + 150}
        />
      </div>
    </div>
  );
}

function HubColumn({
  title,
  tone,
  items,
  delay,
}: {
  title: string;
  tone: string;
  items: string[];
  delay: number;
}) {
  const p = useEnter(delay);
  return (
    <div
      style={{
        ...pop(p),
        flex: tone === color.ember ? 1.15 : 1,
        borderTop: `6px solid ${tone}`,
        background: "rgba(255,253,248,0.06)",
        borderRadius: 14,
        padding: "16px 20px",
      }}
    >
      <div style={{ fontSize: 25, fontWeight: 700, whiteSpace: "nowrap" }}>{title}</div>
      {items.map((item) => (
        <div key={item} style={{ fontSize: 23, marginTop: 8, color: color.line }}>
          {item}
        </div>
      ))}
    </div>
  );
}

// --- Knowledge flowing in, then out ---

function Spokes() {
  const frame = useCurrentFrame();
  const inbound = useWindow(PHASE.center + 10, PHASE.center + 150, 20);
  const outDraw = useT(PHASE.reverse + 130, PHASE.reverse + 160);
  const targets = [...nodes.filter((n) => n.after).map((n) => n.after!.at), agentContext.at];
  return (
    <svg width={1920} height={1080} style={{ position: "absolute" }}>
      {/* Facts leave every source for the center. */}
      {inbound > 0 &&
        nodes.map((node, i) =>
          [0, 1].map((k) => {
            const t = Math.min(1, Math.max(0, (frame - PHASE.center - 10 - i * 6 - k * 22) / 60));
            if (t <= 0 || t >= 1) return null;
            const [x1, y1] = node.before.at;
            return (
              <circle
                key={`${node.id}-${k}`}
                cx={lerp(x1, HUB_CENTER[0], ease(t))}
                cy={lerp(y1, HUB_CENTER[1], ease(t))}
                r={9}
                fill={node.tone}
                opacity={inbound}
              />
            );
          }),
        )}
      {/* Then the arrows reverse: every output reads from the knowledge layer. */}
      {frame > PHASE.reverse + 130 &&
        targets.map(([tx, ty], i) => {
          const x1 = HUB_LEFT[0] + HUB_W / 2;
          const y1 = HUB_LEFT[1];
          const x2 = tx - W / 2;
          const len = Math.hypot(x2 - x1, ty - y1);
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={ty}
                stroke={color.faint}
                strokeWidth={3}
                strokeDasharray={len}
                strokeDashoffset={len * (1 - outDraw)}
              />
              {outDraw >= 1 &&
                [0, 1, 2].map((k) => {
                  const t = ((((frame - PHASE.reverse - 160) / 50 + k / 3 + i * 0.13) % 1) + 1) % 1;
                  return (
                    <circle
                      key={k}
                      cx={lerp(x1, x2, t)}
                      cy={lerp(y1, ty, t)}
                      r={7}
                      fill={color.ember}
                    />
                  );
                })}
            </g>
          );
        })}
    </svg>
  );
}
