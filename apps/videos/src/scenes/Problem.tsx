import { interpolate, useCurrentFrame } from "remotion";
import { Heading, Lede } from "../components/Heading";
import { Scene } from "../components/Scene";
import { pop, useEnter } from "../components/motion";
import { color, fonts } from "../theme";

const places = [
  { who: "Design files", note: "Delete button is red. Label: “Remove”.", tone: color.rust },
  { who: "Product code", note: "Delete button is orange. Label: “Delete”.", tone: color.ember },
  { who: "Docs site", note: "Last updated two releases ago.", tone: color.faint },
  { who: "AI assistants", note: "No idea. Guesses the code.", tone: color.sky },
];

export function Problem() {
  return (
    <Scene>
      <Heading eyebrow="The problem" title="Today, what we know lives in many places." />
      <Lede delay={10}>Each copy is written separately, so over time they quietly disagree.</Lede>
      <div style={{ display: "flex", gap: 36, marginTop: 110 }}>
        {places.map((place, i) => (
          <PlaceCard key={place.who} place={place} i={i} />
        ))}
      </div>
    </Scene>
  );
}

function PlaceCard({ place, i }: { place: (typeof places)[number]; i: number }) {
  const frame = useCurrentFrame();
  const p = useEnter(24 + i * 10);
  // After every card is on screen, the cards drift apart to show the copies diverging.
  const drift = interpolate(frame, [110, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tilt = [-3, 2, -2, 3][i] * drift;
  const dy = [18, -14, 22, -10][i] * drift;
  const doubt = useEnter(125 + i * 6);
  return (
    <div
      style={{
        opacity: pop(p).opacity,
        flex: 1,
        background: color.card,
        border: `2px solid ${color.line}`,
        borderTop: `10px solid ${place.tone}`,
        borderRadius: 20,
        padding: "34px 32px",
        height: 420,
        position: "relative",
        transform: `${pop(p).transform} translateY(${dy}px) rotate(${tilt}deg)`,
        boxShadow: "0 18px 40px rgba(34,26,19,0.08)",
      }}
    >
      <div style={{ fontFamily: fonts.display, fontSize: 46, fontWeight: 600 }}>{place.who}</div>
      <div style={{ fontSize: 34, lineHeight: 1.4, color: color.muted, marginTop: 26 }}>
        {place.note}
      </div>
      <div
        style={{
          ...pop(doubt),
          position: "absolute",
          right: 24,
          bottom: 20,
          width: 60,
          height: 60,
          borderRadius: 999,
          background: color.rustSoft,
          color: color.rustDeep,
          fontSize: 40,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ?
      </div>
    </div>
  );
}
