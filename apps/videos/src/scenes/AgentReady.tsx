import { interpolate, useCurrentFrame } from "remotion";
import { Heading, Lede } from "../components/Heading";
import { Scene } from "../components/Scene";
import { UiButton } from "../components/UiButton";
import { rise, useEnter } from "../components/motion";
import { color, fonts } from "../theme";

const rules = [
  ["01", "Choose the emphasis", "Danger, for a destructive action.", "MUST #danger-for-destructive"],
  ["02", "Name the result", "The label says “Delete project”.", "MUST #label-describes-result"],
  ["03", "Give it space", "Separate it from routine actions.", "SHOULD #follow-action-hierarchy"],
];

export function AgentReady() {
  const frame = useCurrentFrame();
  const emphasis = frame >= 55;
  const label = frame >= 110;
  const placement = interpolate(frame, [160, 185], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const verified = useEnter(210);
  return (
    <Scene>
      <Heading eyebrow="05 / Agent ready" title="The agent asks first." />
      <Lede>It queries the spec, then cites the rule behind each choice.</Lede>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.9fr 1.1fr",
          gap: 100,
          marginTop: 76,
          alignItems: "start",
        }}
      >
        <div>
          {rules.map(([number, title, detail, cite], i) => (
            <Rule
              key={number}
              number={number}
              title={title}
              detail={detail}
              cite={cite}
              delay={20 + i * 55}
            />
          ))}
          <div
            style={{
              ...rise(verified),
              marginTop: 34,
              fontSize: 28,
              color: color.sage,
              fontWeight: 600,
            }}
          >
            ✓ Every choice cites a rule.
          </div>
        </div>
        <div
          style={{
            background: color.card,
            border: `1px solid ${color.line}`,
            borderRadius: 18,
            padding: 44,
            boxShadow: "0 12px 36px rgba(34,26,19,.045)",
          }}
        >
          <div
            style={{
              fontSize: 23,
              letterSpacing: 2,
              color: color.faint,
              textTransform: "uppercase",
            }}
          >
            Project settings
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 38, marginTop: 18 }}>
            Website redesign
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 28, paddingBottom: 28 }}>
            <UiButton variant="secondary" label="Rename" />
            <UiButton variant="ghost" label="Archive" />
          </div>
          <div style={{ borderTop: `1px solid ${color.line}`, paddingTop: 26 + placement * 10 }}>
            <div style={{ opacity: placement, height: placement * 98, overflow: "hidden" }}>
              <div style={{ fontSize: 30, fontWeight: 600 }}>Delete this project</div>
              <div style={{ fontSize: 26, color: color.muted, marginTop: 10 }}>
                Permanently removes this project and its files.
              </div>
            </div>
            <UiButton
              variant={emphasis ? "danger" : "primary"}
              label={label ? "Delete project" : "Remove"}
              scale={1.12}
            />
          </div>
        </div>
      </div>
    </Scene>
  );
}

function Rule({
  number,
  title,
  detail,
  cite,
  delay,
}: {
  number: string;
  title: string;
  detail: string;
  cite: string;
  delay: number;
}) {
  const p = useEnter(delay);
  return (
    <div
      style={{
        ...rise(p, 12),
        display: "grid",
        gridTemplateColumns: "50px 1fr",
        gap: 20,
        padding: "24px 0",
        borderBottom: `1px solid ${color.line}`,
      }}
    >
      <div style={{ fontSize: 24, color: color.sage, paddingTop: 5 }}>{number}</div>
      <div>
        <div style={{ fontSize: 34, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 28, color: color.muted, marginTop: 8 }}>{detail}</div>
        <div style={{ fontFamily: fonts.mono, fontSize: 21, color: color.sage, marginTop: 10 }}>
          {cite}
        </div>
      </div>
    </div>
  );
}
