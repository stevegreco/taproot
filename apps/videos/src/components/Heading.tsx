import { color, fonts } from "../theme";
import { rise, useEnter } from "./motion";

/** Scene title: a small eyebrow label over a serif headline. */
export function Heading({
  eyebrow,
  title,
  delay = 0,
  width = 1400,
}: {
  eyebrow?: string;
  title: string;
  delay?: number;
  width?: number;
}) {
  const p = useEnter(delay);
  return (
    <div style={{ ...rise(p), maxWidth: width }}>
      {eyebrow && (
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: color.emberDeep,
            marginBottom: 16,
          }}
        >
          {eyebrow}
        </div>
      )}
      <div style={{ fontFamily: fonts.display, fontSize: 66, fontWeight: 500, lineHeight: 1.15 }}>
        {title}
      </div>
    </div>
  );
}

/** Supporting sentence under the heading. */
export function Lede({ children, delay = 0 }: { children: string; delay?: number }) {
  const p = useEnter(delay);
  return (
    <div
      style={{
        ...rise(p, 20),
        fontSize: 34,
        lineHeight: 1.4,
        color: color.muted,
        maxWidth: 1300,
        marginTop: 22,
      }}
    >
      {children}
    </div>
  );
}
