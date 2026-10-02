import type { ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { color, fonts } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (frame: number, start: number, length = 14) =>
  interpolate(frame, [start, start + length], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

const mono = { fontFamily: fonts.mono, fontSize: 25, color: color.paper };
const dim = { color: "rgba(226,216,198,.55)" };

/** Values abridged from packages/knowledge/content/components/button/button.spec.yaml. */
const sections: { key: string; label: string; body: ReactNode }[] = [
  {
    key: "parts",
    label: "Anatomy",
    body: (
      <>
        control <span style={dim}>·</span> content
      </>
    ),
  },
  {
    key: "options",
    label: "Parameters",
    body: (
      <>
        variant: primary <span style={dim}>|</span> secondary <span style={dim}>|</span> ghost{" "}
        <span style={dim}>|</span> <span style={{ color: color.emberSoft }}>danger</span>
      </>
    ),
  },
  {
    key: "states",
    label: "States",
    body: (
      <>
        default <span style={dim}>·</span> hover <span style={dim}>·</span> focus{" "}
        <span style={dim}>·</span> pressed <span style={dim}>·</span> disabled
      </>
    ),
  },
  {
    key: "tokens",
    label: "Tokens",
    body: (
      <>
        background <span style={dim}>→</span> component.button.danger.background.default
      </>
    ),
  },
  {
    key: "rules",
    label: "Rules",
    body: (
      <>
        MUST <span style={dim}>#</span>danger-for-destructive
        <br />
        MUST <span style={dim}>#</span>label-describes-result
        <br />
        SHOULD <span style={dim}>#</span>follow-action-hierarchy
      </>
    ),
  },
];

/**
 * The Button contract, written section by section as the narration names each part. The section
 * being spoken is lit; the sheet carries no implementation code.
 */
export function SpecSheet({ cues }: { cues: Record<string, number> }) {
  const frame = useCurrentFrame();
  const starts = sections.map(({ key }) => cues[key]);
  return (
    <div
      style={{
        marginTop: 56,
        background: color.ink,
        borderRadius: 18,
        padding: "34px 48px 26px",
        color: color.paper,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
          <div style={{ fontFamily: fonts.display, fontSize: 44 }}>Button</div>
          <div style={{ ...mono, fontSize: 23, color: color.emberSoft }}>component.button</div>
        </div>
        <div
          style={{
            fontSize: 21,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: color.sageSoft,
            opacity: ease(frame, starts[0] - 24),
          }}
        >
          Contract · no implementation code
        </div>
      </div>
      {sections.map(({ key, label, body }, i) => {
        const shown = ease(frame, starts[i] - 4);
        const next = starts[i + 1];
        const active =
          ease(frame, starts[i] - 4, 8) * (next === undefined ? 1 : 1 - ease(frame, next - 4, 8));
        return (
          <div
            key={key}
            style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr",
              alignItems: "baseline",
              gap: 24,
              padding: "20px 24px",
              margin: "0 -24px",
              borderTop: "1px solid rgba(255,253,248,.12)",
              borderRadius: 10,
              background: `rgba(255,253,248,${0.07 * active})`,
              marginTop: i ? 0 : 26,
            }}
          >
            <div
              style={{
                fontSize: 23,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: color.emberSoft,
                opacity: 0.35 + 0.65 * shown,
              }}
            >
              {label}
            </div>
            <div
              style={{
                ...mono,
                lineHeight: 1.55,
                opacity: shown,
                transform: `translateX(${(1 - shown) * 12}px)`,
              }}
            >
              {body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
