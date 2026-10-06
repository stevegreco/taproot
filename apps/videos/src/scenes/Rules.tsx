import { useCurrentFrame } from "remotion";
import { Chapter } from "../components/Chapter";
import { Panel } from "../components/Panel";
import { Badge, CARD_DROP, CARD_WIDTH, ProjectCard } from "../components/ProjectCard";
import { ease } from "../components/motion";
import { color, fonts } from "../theme";
import { SCENES } from "../timeline";

const { cues } = SCENES.rules;

// Each rule the first attempt breaks, numbered to match the marks on the card. Statements are
// abridged from component.button; the third points on to the pattern it applies.
const rules = [
  ["MUST", "danger-for-destructive", "Use danger only for destructive actions.", ""],
  ["MUST", "label-describes-result", "Use a concise label that describes the result.", ""],
  [
    "SHOULD",
    "follow-action-hierarchy",
    "Apply the action hierarchy pattern.",
    "pattern.action-hierarchy",
  ],
] as const;

export function Rules() {
  const frame = useCurrentFrame();
  const rule = (i: number) => ease(frame, 24 + i * 36);
  const levels = ease(frame, cues.levels - 4, 12);
  return (
    <Chapter number="05" name="Labels" title="Label every rule." align="start">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `1fr ${CARD_WIDTH}px`,
          gap: 80,
          alignItems: "start",
          marginTop: CARD_DROP,
        }}
      >
        <Panel style={{ padding: "38px 44px" }}>
          <div
            style={{
              color: color.emberSoft,
              textTransform: "uppercase",
              letterSpacing: 2,
              fontSize: 23,
            }}
          >
            component.button
          </div>
          {rules.map(([level, id, value, follows], i) => (
            <div
              key={id}
              style={{
                opacity: rule(i),
                display: "grid",
                gridTemplateColumns: "54px 120px 1fr",
                gap: 16,
                padding: "22px 0",
                borderBottom: i < 2 ? "1px solid rgba(255,253,248,.15)" : undefined,
              }}
            >
              <div style={{ position: "relative" }}>
                <Badge n={i + 1} p={1} />
              </div>
              <div
                style={{
                  fontSize: 25,
                  color: color.emberSoft,
                  fontWeight: 700,
                  paddingTop: 4,
                  opacity: 0.45 + 0.55 * levels,
                }}
              >
                {level}
              </div>
              <div>
                <div style={{ fontSize: 29 }}>{value}</div>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 24,
                    color: color.line,
                    marginTop: 6,
                  }}
                >
                  #{id}
                  {follows && <div style={{ color: color.emberSoft }}>→ {follows}</div>}
                </div>
              </div>
            </div>
          ))}
        </Panel>
        <ProjectCard marks={[rule(0), rule(1), rule(2)]} />
      </div>
    </Chapter>
  );
}
