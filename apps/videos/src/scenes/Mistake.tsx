import { useCurrentFrame } from "remotion";
import { Chapter } from "../components/Chapter";
import { ProjectCard } from "../components/ProjectCard";
import { ease } from "../components/motion";
import { color, fonts } from "../theme";

export function Mistake() {
  const frame = useCurrentFrame();
  return (
    <Chapter number="02" name="The gap" title="A plausible answer can still be wrong.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 72,
          marginTop: 96,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: color.faint,
            }}
          >
            The request
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 54, lineHeight: 1.25, marginTop: 20 }}>
            “Add an action to
            <br />
            delete this project.”
          </div>
          <div
            style={{
              opacity: ease(frame, 75),
              fontSize: 30,
              marginTop: 38,
              color: color.rustDeep,
            }}
          >
            It looks right. It misses the point.
          </div>
        </div>
        <ProjectCard style={{ opacity: ease(frame, 30) }} />
      </div>
    </Chapter>
  );
}
