import type { ReactNode } from "react";
import { Heading } from "../components/Heading";
import { Pill } from "../components/Pill";
import { Scene } from "../components/Scene";
import { pop, rise, useEnter } from "../components/motion";
import { color, fonts } from "../theme";

// The lookups, markup, and test numbers are real: `knowledge get button --impl web` and the agent
// retrieval evaluation in docs/research/agent-retrieval.
export function AgentReady() {
  const ask = useEnter(15);
  const code = useEnter(130);
  const preview = useEnter(250);
  const stat = useEnter(330);
  return (
    <Scene>
      <Heading
        eyebrow="Agent ready"
        title="An agent asks first, then builds it right."
        width={1700}
      />
      <div style={{ display: "flex", gap: 60, marginTop: 50, alignItems: "flex-start" }}>
        <div style={{ flex: 1.45, display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              ...rise(ask, 20),
              alignSelf: "flex-end",
              background: color.ink,
              color: color.paper,
              fontSize: 31,
              borderRadius: "24px 24px 6px 24px",
              padding: "20px 28px",
              maxWidth: 820,
            }}
          >
            Add a button that deletes the project.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Lookup delay={50} command="search delete project" found="Button, Action hierarchy" />
            <Lookup
              delay={85}
              command="get button --impl web"
              found="what it is, plus how to build it here"
            />
          </div>
          <div
            style={{
              ...rise(code, 20),
              background: color.ink,
              color: color.paper,
              borderRadius: 20,
              padding: "26px 30px",
              fontFamily: fonts.mono,
              fontSize: 27,
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: color.faint }}>&lt;</span>
            <span style={{ color: color.emberSoft }}>ds-button</span>{" "}
            <Attr name="type" value="button" /> <Attr name="variant" value="danger" />
            <span style={{ color: color.faint }}>&gt;</span>
            <br />
            &nbsp;&nbsp;Delete project
            <br />
            <span style={{ color: color.faint }}>&lt;/</span>
            <span style={{ color: color.emberSoft }}>ds-button</span>
            <span style={{ color: color.faint }}>&gt;</span>
          </div>
          <Source delay={175} tag="The record" bg={color.ink} fg={color.paper}>
            Danger only for destructive actions. The label names the result.
          </Source>
          <Source delay={205} tag="Web implementation" bg={color.sageSoft} fg={color.sage}>
            The element, its import, and which attribute sets each option.
          </Source>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              ...pop(preview),
              background: color.card,
              border: `2px solid ${color.line}`,
              borderRadius: 26,
              padding: "34px 36px",
              boxShadow: "0 20px 50px rgba(34,26,19,0.10)",
            }}
          >
            <div
              style={{
                fontSize: 21,
                fontWeight: 700,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                color: color.faint,
              }}
            >
              Danger zone
            </div>
            <div style={{ fontFamily: fonts.display, fontSize: 38, fontWeight: 600, marginTop: 8 }}>
              Delete this project
            </div>
            <div style={{ fontSize: 26, color: color.muted, marginTop: 10, lineHeight: 1.35 }}>
              This removes every file and cannot be undone.
            </div>
            {/* The real web component, rendered from the markup on the left. */}
            <div style={{ zoom: 1.8, marginTop: 16 }}>
              <ds-button type="button" variant="danger">
                Delete project
              </ds-button>
            </div>
          </div>
          <div
            style={{
              ...rise(stat, 20),
              background: color.sageSoft,
              borderRadius: 22,
              padding: "26px 30px",
            }}
          >
            <div style={{ fontSize: 24, color: color.sage, fontWeight: 700, letterSpacing: 1 }}>
              IN OUR TEST, THREE AGENTS, THREE SCREENS
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 10 }}>
              <span style={{ fontFamily: fonts.display, fontSize: 72, color: color.rust }}>14</span>
              <span style={{ fontSize: 40, color: color.muted }}>→</span>
              <span style={{ fontFamily: fonts.display, fontSize: 72, color: color.sage }}>0</span>
              <span style={{ fontSize: 28, color: color.ink, lineHeight: 1.3 }}>
                guessed element, attribute, and import names
              </span>
            </div>
          </div>
        </div>
      </div>
    </Scene>
  );
}

function Attr({ name, value }: { name: string; value: string }) {
  return (
    <>
      <span style={{ color: color.sageSoft }}>{name}</span>
      <span style={{ color: color.faint }}>=</span>
      <span style={{ color: color.ember }}>"{value}"</span>
    </>
  );
}

function Lookup({ delay, command, found }: { delay: number; command: string; found: string }) {
  const p = useEnter(delay);
  return (
    <div
      style={{
        ...rise(p, 12),
        display: "flex",
        alignItems: "center",
        gap: 14,
        fontSize: 25,
        color: color.muted,
      }}
    >
      <span
        style={{
          fontFamily: fonts.mono,
          fontSize: 23,
          background: color.sageSoft,
          color: color.sage,
          borderRadius: 8,
          padding: "4px 12px",
        }}
      >
        knowledge {command}
      </span>
      <span>→ {found}</span>
    </div>
  );
}

function Source({
  delay,
  tag,
  bg,
  fg,
  children,
}: {
  delay: number;
  tag: string;
  bg: string;
  fg: string;
  children: ReactNode;
}) {
  const p = useEnter(delay);
  return (
    <div style={{ ...rise(p, 10), display: "flex", alignItems: "center", gap: 14, fontSize: 27 }}>
      <Pill bg={bg} fg={fg} style={{ flexShrink: 0 }}>
        {tag}
      </Pill>
      <span style={{ color: color.ink }}>{children}</span>
    </div>
  );
}
