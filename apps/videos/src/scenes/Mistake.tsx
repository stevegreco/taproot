import { useCurrentFrame } from "remotion";
import { Chapter } from "../components/Chapter";
import { CARD_DROP, CARD_WIDTH, ProjectCard } from "../components/ProjectCard";
import { ease } from "../components/motion";
import { color, fonts } from "../theme";

export function Mistake() {
  const frame = useCurrentFrame();
  return (
    <Chapter
      number="02"
      name="The gap"
      title="A good guess can still be wrong."
      align="start"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `1fr ${CARD_WIDTH}px`,
          gap: 80,
          alignItems: "start",
          marginTop: CARD_DROP,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: color.faint,
            }}
          >
            The request
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 66, lineHeight: 1.2, marginTop: 20 }}>
            “Add an action to
            <br />
            delete this project.”
          </div>
          <div
            style={{
              opacity: ease(frame, 75),
              fontSize: 34,
              marginTop: 40,
              color: color.rustDeep,
            }}
          >
            It looks right. But it isn’t.
          </div>
        </div>
        <ProjectCard style={{ opacity: ease(frame, 30) }} />
      </div>
    </Chapter>
  );
}
