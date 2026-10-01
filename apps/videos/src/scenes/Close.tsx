import { AbsoluteFill } from "remotion";
import { Scene } from "../components/Scene";
import { pop, rise, useEnter } from "../components/motion";
import { color, fonts } from "../theme";

// Before and after, side by side: the same sources, first tangled, then reading from one center.
const ring = [
  [-130, -60],
  [10, -95],
  [140, -50],
  [150, 70],
  [0, 100],
  [-140, 60],
];

export function Close() {
  const before = useEnter(5);
  const after = useEnter(25);
  const line = useEnter(55);
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 90 }}>
          <Mini label="Before" p={before} tangled />
          <div style={{ ...pop(after), fontSize: 64, color: color.faint }}>→</div>
          <Mini label="After" p={after} />
        </div>
        <div
          style={{
            ...rise(line, 20),
            fontFamily: fonts.display,
            fontSize: 64,
            fontWeight: 500,
            marginTop: 70,
            textAlign: "center",
          }}
        >
          From many sources of truth to one.
        </div>
        <div
          style={{
            ...rise(line, 20),
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: color.sage,
            marginTop: 22,
          }}
        >
          Agent ready
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

function Mini({ label, p, tangled = false }: { label: string; p: number; tangled?: boolean }) {
  const cx = 200;
  const cy = 150;
  const tones = [color.rust, color.ember, color.sky, color.faint, color.slate, color.emberDeep];
  return (
    <div style={{ ...pop(p), textAlign: "center" }}>
      <svg width={400} height={300}>
        {tangled
          ? ring.flatMap(([x1, y1], i) =>
              ring
                .slice(i + 1)
                .map(([x2, y2], j) => (
                  <line
                    key={`${i}-${j}`}
                    x1={cx + x1}
                    y1={cy + y1}
                    x2={cx + x2}
                    y2={cy + y2}
                    stroke={color.faint}
                    strokeWidth={2}
                    opacity={0.5}
                  />
                )),
            )
          : ring.map(([x, y], i) => (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + x}
                y2={cy + y}
                stroke={color.faint}
                strokeWidth={3}
              />
            ))}
        {ring.map(([x, y], i) => (
          <circle key={i} cx={cx + x} cy={cy + y} r={20} fill={tones[i]} />
        ))}
        {!tangled && <circle cx={cx} cy={cy} r={42} fill={color.ink} />}
      </svg>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: color.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
}
