import { AbsoluteFill } from "remotion";
import { Scene } from "../components/Scene";
import { rise, useEnter } from "../components/motion";
import { color, fonts } from "../theme";

const points = [
  { title: "Written once", text: "Our context in plain files, reviewed like any document." },
  { title: "Checked", text: "Every change is validated before anyone relies on it." },
  { title: "Read everywhere", text: "Docs, people, and agents all get the same answer." },
];

export function Outro() {
  const head = useEnter(0);
  const sign = useEnter(110);
  return (
    <Scene>
      <AbsoluteFill style={{ padding: "110px 120px", display: "flex", flexDirection: "column" }}>
        <div style={{ ...rise(head), fontFamily: fonts.display, fontSize: 70, fontWeight: 500 }}>
          Simple by design
        </div>
        <div style={{ display: "flex", gap: 36, marginTop: 90 }}>
          {points.map((pt, i) => (
            <Point key={pt.title} n={i + 1} {...pt} delay={18 + i * 16} />
          ))}
        </div>
        <div
          style={{
            ...rise(sign, 20),
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ width: 26, height: 26, borderRadius: 999, background: color.ember }} />
          <div style={{ width: 26, height: 26, borderRadius: 999, background: color.sage }} />
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginLeft: 8,
            }}
          >
            The knowledge layer · agent ready
          </div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

function Point({
  n,
  title,
  text,
  delay,
}: {
  n: number;
  title: string;
  text: string;
  delay: number;
}) {
  const p = useEnter(delay);
  return (
    <div
      style={{
        ...rise(p),
        flex: 1,
        background: color.card,
        border: `2px solid ${color.line}`,
        borderRadius: 24,
        padding: "48px 44px 56px",
      }}
    >
      <div style={{ fontFamily: fonts.display, fontSize: 110, color: color.ember, lineHeight: 1 }}>
        {n}
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 42, fontWeight: 600, marginTop: 20 }}>
        {title}
      </div>
      <div style={{ fontSize: 34, color: color.muted, marginTop: 18, lineHeight: 1.4 }}>{text}</div>
    </div>
  );
}
