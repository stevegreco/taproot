import { Heading, Lede } from "../components/Heading";
import { Scene } from "../components/Scene";
import { pop, rise, useEnter } from "../components/motion";
import { color, fonts } from "../theme";

const types = [
  {
    name: "Components",
    what: "The building blocks.",
    example: "Button, Checkbox, Link",
    tone: color.ember,
    soft: color.emberSoft,
  },
  {
    name: "Patterns",
    what: "How blocks work together.",
    example: "Action hierarchy",
    tone: color.sage,
    soft: color.sageSoft,
  },
  {
    name: "Guidelines",
    what: "Principles that apply everywhere.",
    example: "Compose or propose",
    tone: color.sky,
    soft: color.skySoft,
  },
  {
    name: "Examples",
    what: "Real screens, explained.",
    example: "A settings page",
    tone: color.emberDeep,
    soft: "#f2ebdf",
  },
];

export function Library() {
  const hub = useEnter(20);
  return (
    <Scene>
      <Heading eyebrow="The idea" title="Write it down once, in one shared library." />
      <Lede delay={10}>
        Plain, readable files that the whole team can review, like any other document.
      </Lede>
      <div style={{ display: "flex", alignItems: "center", gap: 60, marginTop: 70 }}>
        <div
          style={{
            ...pop(hub),
            width: 420,
            height: 420,
            borderRadius: 32,
            background: color.ink,
            color: color.paper,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
            {[color.ember, color.sage, color.sky, color.emberDeep].map((c) => (
              <div key={c} style={{ width: 22, height: 110, borderRadius: 6, background: c }} />
            ))}
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 50, fontWeight: 500 }}>Knowledge</div>
          <div style={{ fontFamily: fonts.display, fontSize: 50, fontWeight: 500 }}>library</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, flex: 1 }}>
          {types.map((t, i) => (
            <TypeCard key={t.name} type={t} delay={40 + i * 15} />
          ))}
        </div>
      </div>
    </Scene>
  );
}

function TypeCard({ type, delay }: { type: (typeof types)[number]; delay: number }) {
  const p = useEnter(delay);
  return (
    <div
      style={{
        ...rise(p),
        background: color.card,
        border: `2px solid ${color.line}`,
        borderLeft: `12px solid ${type.tone}`,
        borderRadius: 18,
        padding: "26px 30px",
      }}
    >
      <div style={{ fontFamily: fonts.display, fontSize: 40, fontWeight: 600 }}>{type.name}</div>
      <div style={{ fontSize: 30, color: color.muted, marginTop: 8 }}>{type.what}</div>
      <div
        style={{
          display: "inline-block",
          marginTop: 16,
          fontSize: 24,
          background: type.soft,
          color: color.ink,
          borderRadius: 8,
          padding: "4px 12px",
        }}
      >
        e.g. {type.example}
      </div>
    </div>
  );
}
