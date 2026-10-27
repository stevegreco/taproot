import { useCurrentFrame } from "remotion";
import { Chapter } from "../components/Chapter";
import { Panel } from "../components/Panel";
import { Badge, CARD_WIDTH } from "../components/ProjectCard";
import { UiButton } from "../components/UiButton";
import { ease, rise } from "../components/motion";
import { color, fonts } from "../theme";
import { SCENES } from "../timeline";

const { cues } = SCENES.audit;

// The same three rules the viewer has already met, now found broken on a screen that already
// exists. Grouped by level, so the musts read as the ones to fix first.
const groups = [
  {
    level: "MUST",
    cue: cues.must,
    issues: [
      [1, "Red is for actions that destroy something. Saving isn’t one.", "danger-for-destructive"],
      [2, "“Submit” doesn’t say what happens.", "label-describes-result"],
    ],
  },
  {
    level: "SHOULD",
    cue: cues.should,
    issues: [[3, "Two buttons compete for attention.", "follow-action-hierarchy"]],
  },
] as const;

const SCAN = 40;

export function Audit() {
  const frame = useCurrentFrame();
  const scan = ease(frame, cues.scan - 6, SCAN);
  const report = ease(frame, cues.scan + 4, 14);
  const rule = ease(frame, cues.which - 4, 14);
  const pin = (n: number) => ease(frame, (n === 3 ? cues.should : cues.must) + (n - 1) * 6, 12);
  return (
    <Chapter number="09" name="Review" title="Check what you already have.">
      <div style={{ display: "grid", gridTemplateColumns: `1fr ${CARD_WIDTH}px`, gap: 80 }}>
        <Panel style={{ padding: "34px 44px", opacity: report }}>
          <div
            style={{
              color: color.emberSoft,
              textTransform: "uppercase",
              letterSpacing: 2,
              fontSize: 23,
            }}
          >
            Review · Account settings
          </div>
          {groups.map(({ level, cue, issues }) => (
            <div key={level} style={{ ...rise(ease(frame, cue - 6, 12), 10), marginTop: 26 }}>
              <div style={{ fontSize: 23, fontWeight: 700, color: color.emberSoft }}>
                {level} · {issues.length}
              </div>
              {issues.map(([n, text, id], i) => (
                <div
                  key={id}
                  style={{
                    ...rise(ease(frame, cue + i * 6, 12), 8),
                    display: "grid",
                    gridTemplateColumns: "54px 1fr",
                    padding: "16px 0",
                    borderBottom: "1px solid rgba(255,253,248,.15)",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <Badge n={n} p={1} />
                  </div>
                  <div>
                    <div style={{ fontSize: 28 }}>{text}</div>
                    <div
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 22,
                        color: color.line,
                        marginTop: 6,
                        opacity: rule,
                      }}
                    >
                      #{id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Panel>
        <AccountCard scan={scan} pin={pin} />
      </div>
    </Chapter>
  );
}

const S = 1.2;

/** An existing settings screen with three problems, swept by the review as the narration starts. */
function AccountCard({ scan, pin }: { scan: number; pin: (n: number) => number }) {
  const field = (label: string, value: string) => (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 22, color: color.muted }}>{label}</div>
      <div
        style={{
          marginTop: 8,
          border: `2px solid ${color.line}`,
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 26,
        }}
      >
        {value}
      </div>
    </div>
  );
  return (
    <div
      style={{
        position: "relative",
        boxSizing: "border-box",
        width: CARD_WIDTH,
        background: color.card,
        border: `1px solid ${color.line}`,
        borderRadius: 20,
        padding: 52,
        boxShadow: "0 12px 36px rgba(34,26,19,.045)",
      }}
    >
      <div
        style={{ fontSize: 25, letterSpacing: 2, color: color.faint, textTransform: "uppercase" }}
      >
        Account settings
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 46, marginTop: 18 }}>Your profile</div>
      {field("Name", "Sam Rivera")}
      {field("Email", "sam@example.com")}
      <div style={{ display: "flex", gap: 22, marginTop: 36 }}>
        <div style={{ position: "relative" }}>
          <UiButton variant="danger" label="Submit" scale={S} />
          <Badge n={1} p={pin(1)} style={{ left: -18, top: -18 }} />
          <Badge n={2} p={pin(2)} style={{ right: -18, top: -18 }} />
        </div>
        <div style={{ position: "relative" }}>
          <UiButton variant="primary" label="Cancel" scale={S} />
          <Badge n={3} p={pin(3)} style={{ right: -18, top: -18 }} />
        </div>
      </div>
      {/* The review sweeps the screen once, left to right. */}
      {scan > 0 && scan < 1 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${scan * 100}%`,
            width: 4,
            background: color.sky,
            boxShadow: `0 0 24px 8px ${color.skySoft}`,
            opacity: Math.sin(scan * Math.PI),
          }}
        />
      )}
    </div>
  );
}
