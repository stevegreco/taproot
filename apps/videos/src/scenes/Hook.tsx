import { AbsoluteFill } from "remotion";
import { Byline } from "../components/Byline";
import { Scene } from "../components/Scene";
import { color, fonts } from "../theme";

// The opening title card is complete on frame 0, so the video's first frame (and any player's
// preview before playback) shows the title and byline instead of a blank page.
export function Hook() {
  return (
    <Scene>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
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
            fontFamily: fonts.display,
            fontSize: 90,
            fontWeight: 500,
            lineHeight: 1.1,
            marginTop: 40,
            maxWidth: 1380,
          }}
        >
          Your design system has a new kind of reader.
        </div>
        <Byline style={{ marginTop: 48 }} />
      </AbsoluteFill>
    </Scene>
  );
}
