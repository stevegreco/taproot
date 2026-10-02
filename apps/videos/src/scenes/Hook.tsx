import { AbsoluteFill } from "remotion";
import { Scene } from "../components/Scene";
import { rise, useEnter } from "../components/motion";
import { color, fonts } from "../theme";

export function Hook() {
  const mark = useEnter(0);
  const title = useEnter(10);
  return (
    <Scene>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ ...rise(mark), display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 16, height: 16, borderRadius: 999, background: color.ember }} />
          <div style={{ width: 16, height: 16, borderRadius: 999, background: color.sage }} />
          <div
            style={{
              fontSize: 25,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              marginLeft: 10,
            }}
          >
            The design system spec
          </div>
        </div>
        <div
          style={{
            ...rise(title),
            fontFamily: fonts.display,
            fontSize: 90,
            fontWeight: 500,
            lineHeight: 1.1,
            marginTop: 40,
            maxWidth: 1380,
          }}
        >
          AI changes who reads your design system.
        </div>
      </AbsoluteFill>
    </Scene>
  );
}
