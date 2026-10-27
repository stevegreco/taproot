import { useCurrentFrame } from "remotion";
import { Chapter } from "../components/Chapter";
import { Panel } from "../components/Panel";
import { ease } from "../components/motion";
import { color, fonts } from "../theme";
import { SCENES } from "../timeline";

const { cues } = SCENES.structured;

// The same Button facts twice: buried in a paragraph, then as named fields. Values are abridged
// from component.button; the looked-up row is the rule the agent needs for a delete button.
const prose =
  "Buttons come in a few styles. Most screens use the primary one, though some teams reach for secondary or ghost. For anything risky, like deleting, we've mostly used the red one, and the label should usually say what happens…";

const fields = [
  ["parameters.variant", "primary | secondary | ghost | danger"],
  ["states", "default · hover · focus · pressed · disabled"],
  ["rules#danger-for-destructive", "MUST · Use danger only for destructive actions."],
  ["rules#label-describes-result", "MUST · Use a label that describes the result."],
] as const;
const LOOKED_UP = 2;

const label = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: 2,
  textTransform: "uppercase",
} as const;

export function Structured() {
  const frame = useCurrentFrame();
  const page = ease(frame, cues.page - 6, 14);
  const panel = ease(frame, cues.structured - 6, 14);
  const lookup = ease(frame, cues.lookup - 4, 12);
  const guess = ease(frame, cues.guess - 4, 16);
  return (
    <Chapter number="04" name="Structured" title="Look it up, don't read it.">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.25fr",
          gap: 64,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            background: color.card,
            border: `1px solid ${color.line}`,
            borderRadius: 16,
            padding: "38px 44px",
            opacity: page * (1 - 0.55 * guess),
            translate: `0 ${(1 - page) * 18}px`,
          }}
        >
          <div style={{ ...label, color: color.faint }}>A page of text</div>
          <p
            style={{
              fontFamily: fonts.display,
              fontSize: 31,
              lineHeight: 1.6,
              color: color.muted,
              margin: "24px 0 0",
            }}
          >
            {prose}
          </p>
        </div>
        <Panel
          style={{ padding: "38px 44px", opacity: panel, translate: `0 ${(1 - panel) * 18}px` }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ ...label, color: color.sageSoft }}>Structured data</div>
            <div style={{ fontFamily: fonts.mono, fontSize: 23, color: color.emberSoft }}>
              component.button
            </div>
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 24,
              color: color.sageSoft,
              marginTop: 22,
              opacity: lookup,
            }}
          >
            → look up component.button#danger-for-destructive
          </div>
          {fields.map(([key, value], i) => {
            const shown = ease(frame, cues.named - 6 + i * 8, 12);
            const lit = i === LOOKED_UP ? lookup : 0;
            return (
              <div
                key={key}
                style={{
                  padding: "20px 24px",
                  margin: i ? "0 -24px" : "18px -24px 0",
                  borderTop: "1px solid rgba(255,253,248,.12)",
                  borderRadius: 10,
                  background: `rgba(255,253,248,${0.1 * lit})`,
                  opacity: (0.4 + 0.6 * shown) * (1 - 0.5 * lookup * (i === LOOKED_UP ? 0 : 1)),
                }}
              >
                <div style={{ fontFamily: fonts.mono, fontSize: 25, color: color.emberSoft }}>
                  {key}
                </div>
                <div style={{ fontSize: 27, marginTop: 6 }}>{value}</div>
              </div>
            );
          })}
        </Panel>
      </div>
    </Chapter>
  );
}
