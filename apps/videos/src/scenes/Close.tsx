import { AbsoluteFill } from "remotion";
import { Byline } from "../components/Byline";
import { Scene } from "../components/Scene";
import { rise, useEnter } from "../components/motion";
import { color, fonts } from "../theme";

export function Close() {
  const title = useEnter(0);
  const signature = useEnter(18);
  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div
          style={{ ...rise(title), width: 72, height: 5, background: color.sage, marginBottom: 44 }}
        />
        <div
          style={{
            ...rise(title),
            fontFamily: fonts.display,
            fontSize: 86,
            lineHeight: 1.18,
            maxWidth: 1400,
          }}
        >
          Write the reasons down once.
          <br />
          Everyone can follow them.
        </div>
        <div
          style={{
            ...rise(signature),
            fontSize: 25,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: color.sage,
            marginTop: 46,
            fontWeight: 600,
          }}
        >
          The design system spec
        </div>
        <Byline style={{ ...rise(signature), marginTop: 18 }} />
      </AbsoluteFill>
    </Scene>
  );
}
