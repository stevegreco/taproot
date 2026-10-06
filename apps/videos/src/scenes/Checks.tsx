import { useCurrentFrame } from "remotion";
import { Chapter } from "../components/Chapter";
import { Panel } from "../components/Panel";
import { ease } from "../components/motion";
import { color, fonts } from "../theme";
import { SCENES } from "../timeline";

const { cues } = SCENES.checks;

// The cross-record checks from SPEC.md, ticked off as the narration names them.
const checks = [
  "Every link and reference resolves to a record or section",
  "Every default and example is one of its parameter's values",
  "Every token part is an anatomy part",
  "Every ID is unique",
];

export function Checks() {
  const frame = useCurrentFrame();
  return (
    <Chapter number="06" name="Checks" title="Checked, so it stays true.">
      <Panel style={{ marginTop: 80, padding: "40px 48px", fontFamily: fonts.mono, fontSize: 27 }}>
        <div style={{ color: color.line, opacity: ease(frame, 10, 12) }}>$ ds-spec validate</div>
        {checks.map((check, i) => (
          <div
            key={check}
            style={{
              marginTop: 20,
              opacity: ease(frame, cues.checked - 6 + i * 12, 12),
              display: "flex",
              gap: 18,
            }}
          >
            <span style={{ color: color.sageSoft }}>✓</span>
            {check}
          </div>
        ))}
        <div
          style={{
            marginTop: 30,
            color: color.sageSoft,
            fontWeight: 600,
            opacity: ease(frame, cues.checked + 48, 12),
          }}
        >
          OK: 14 records, no issues.
        </div>
      </Panel>
    </Chapter>
  );
}
