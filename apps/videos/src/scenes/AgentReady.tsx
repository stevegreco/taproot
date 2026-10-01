import { Heading, Lede } from "../components/Heading";
import { Pill } from "../components/Pill";
import { Scene } from "../components/Scene";
import { UiButton } from "../components/UiButton";
import { pop, rise, useEnter } from "../components/motion";
import { color, fonts } from "../theme";

// The agent from the Shift scene returns and asks the knowledge layer before it builds.
const questions = [
  { q: "Which component?", a: "Button, danger variant.", source: "Contract" },
  {
    q: "What rules apply?",
    a: "Danger only for destructive actions. The label names the result.",
    source: "Contract",
  },
  { q: "Where does it go?", a: "In its own group, away from routine actions.", source: "Pattern" },
  { q: "How do I build it here?", a: "This platform's element and attributes.", source: "Library" },
];

export function AgentReady() {
  const chip = useEnter(10);
  const result = useEnter(200);
  return (
    <Scene>
      <Heading eyebrow="The result" title="Agent ready." />
      <Lede delay={8}>The agent asks the knowledge layer first, then builds the right thing.</Lede>
      <div style={{ display: "flex", gap: 60, marginTop: 50, alignItems: "center" }}>
        <div style={{ flex: 1.4 }}>
          <div
            style={{
              ...rise(chip, 16),
              display: "inline-flex",
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
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
            {questions.map((item, i) => (
              <Exchange key={item.q} {...item} delay={30 + i * 38} />
            ))}
          </div>
        </div>
        <div
          style={{
            ...pop(result),
            flex: 1,
            background: color.card,
            border: `2px solid ${color.line}`,
            borderRadius: 26,
            padding: "34px 36px",
            boxShadow: "0 20px 50px rgba(34,26,19,0.10)",
          }}
        >
          <div
            style={{
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              color: color.faint,
            }}
          >
            Danger zone
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 38, fontWeight: 600, marginTop: 8 }}>
            Delete this project
          </div>
          <div style={{ fontSize: 26, color: color.muted, marginTop: 10, lineHeight: 1.35 }}>
            This removes every file and cannot be undone.
          </div>
          <div style={{ marginTop: 26 }}>
            <UiButton variant="danger" label="Delete project" />
          </div>
          <div style={{ marginTop: 24 }}>
            <Pill bg={color.sageSoft} fg={color.sage}>
              ✓ Matches the contract
            </Pill>
          </div>
        </div>
      </div>
    </Scene>
  );
}

function Exchange({
  q,
  a,
  source,
  delay,
}: {
  q: string;
  a: string;
  source: string;
  delay: number;
}) {
  const p = useEnter(delay);
  const answer = useEnter(delay + 14);
  return (
    <div style={{ ...rise(p, 12) }}>
      <div style={{ fontSize: 27, fontWeight: 700, color: color.ink }}>{q}</div>
      <div
        style={{
          ...rise(answer, 8),
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginTop: 6,
          fontSize: 26,
          color: color.muted,
        }}
      >
        <Pill bg={color.ink} fg={color.paper} style={{ flexShrink: 0, fontSize: 17 }}>
          {source}
        </Pill>
        {a}
      </div>
    </div>
  );
}
