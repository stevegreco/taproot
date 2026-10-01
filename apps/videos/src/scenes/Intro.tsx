import { AbsoluteFill } from "remotion";
import { Scene } from "../components/Scene";
import { rise, useEnter } from "../components/motion";
import { color, fonts } from "../theme";

export function Intro() {
  const mark = useEnter(0);
  const title = useEnter(12);
  const sub = useEnter(30);
  return (
    <Scene>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div
          style={{
            ...rise(mark),
            display: "flex",
            gap: 14,
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 999, background: color.ember }} />
          <div style={{ width: 30, height: 30, borderRadius: 999, background: color.sage }} />
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              marginLeft: 10,
            }}
          >
            Design system
          </div>
        </div>
        <div
          style={{
            ...rise(title),
            fontFamily: fonts.display,
            fontSize: 104,
            fontWeight: 500,
            lineHeight: 1.08,
          }}
        >
          The knowledge layer
        </div>
        <div
          style={{
            ...rise(sub),
            fontSize: 40,
            color: color.muted,
            marginTop: 34,
            maxWidth: 1200,
            lineHeight: 1.35,
          }}
        >
          Our design context, written once and read by every person and every agent.
        </div>
      </AbsoluteFill>
    </Scene>
  );
}
