import { interpolate, useCurrentFrame } from "remotion";
import { Heading } from "../components/Heading";
import { Scene } from "../components/Scene";
import { ProjectCard } from "../components/ProjectCard";
import { rise, useEnter } from "../components/motion";
import { color, fonts } from "../theme";
import { AGENT_CUES } from "../timeline";

// The MCP tool calls the agent makes, as the server names them.
const calls = [
  {
    call: 'search("destructive action")',
    result: "pattern.action-hierarchy, component.button",
    cue: AGENT_CUES.search,
  },
  {
    call: 'get("component.button")',
    result: 'get("pattern.action-hierarchy")',
    cue: AGENT_CUES.read,
  },
];

// Each decision and the rule addresses it cites.
const decisions = [
  {
    title: "Danger, because it is destructive",
    cites: ["MUST component.button#danger-for-destructive"],
    cue: AGENT_CUES.emphasis,
  },
  {
    title: "A label that names the result",
    cites: ["MUST component.button#label-describes-result"],
    cue: AGENT_CUES.label,
  },
  {
    title: "A place apart from routine actions",
    cites: [
      "SHOULD component.button#follow-action-hierarchy",
      "→ pattern.action-hierarchy#separate-unrelated-decisions",
    ],
    cue: AGENT_CUES.placement,
  },
];

export function AgentReady() {
  const frame = useCurrentFrame();
  const emphasis = frame >= AGENT_CUES.emphasis;
  const label = frame >= AGENT_CUES.label;
  const placement = interpolate(frame, [AGENT_CUES.placement, AGENT_CUES.placement + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const verified = useEnter(AGENT_CUES.verified);
  const request = useEnter(8);
  return (
    <Scene>
      <Heading eyebrow="07 / Agent ready" title="The agent asks first." />
      <div style={{ ...rise(request, 12), fontSize: 32, color: color.muted, marginTop: 22 }}>
        Same request:{" "}
        <span style={{ fontFamily: fonts.display }}>“Add an action to delete this project.”</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 0.95fr",
          gap: 80,
          marginTop: 48,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              background: color.ink,
              borderRadius: 14,
              padding: "22px 28px",
              fontFamily: fonts.mono,
              fontSize: 21,
              lineHeight: 1.5,
            }}
          >
            {calls.map((call, i) => (
              <Call key={call.call} {...call} first={i === 0} />
            ))}
          </div>
          {decisions.map((decision) => (
            <Decision key={decision.title} {...decision} />
          ))}
          <div
            style={{
              ...rise(verified),
              marginTop: 26,
              fontSize: 28,
              color: color.sage,
              fontWeight: 600,
            }}
          >
            ✓ Every choice cites a rule.
          </div>
        </div>
        <ProjectCard emphasis={emphasis} label={label} placement={placement} />
      </div>
    </Scene>
  );
}

function Call({
  call,
  result,
  cue,
  first,
}: {
  call: string;
  result: string;
  cue: number;
  first: boolean;
}) {
  const p = useEnter(cue - 6);
  return (
    <div style={{ ...rise(p, 8), marginTop: first ? 0 : 12 }}>
      <div style={{ color: color.emberSoft }}>{call}</div>
      {/* A search returns records; the second line of reads is another call. */}
      <div style={{ color: first ? color.line : color.emberSoft }}>
        {first ? `→ ${result}` : result}
      </div>
    </div>
  );
}

function Decision({ title, cites, cue }: { title: string; cites: string[]; cue: number }) {
  const p = useEnter(cue - 8);
  return (
    <div style={{ ...rise(p, 12), padding: "20px 0", borderBottom: `1px solid ${color.line}` }}>
      <div style={{ fontSize: 30, fontWeight: 600 }}>{title}</div>
      {cites.map((cite) => (
        <div
          key={cite}
          style={{ fontFamily: fonts.mono, fontSize: 19, color: color.sage, marginTop: 8 }}
        >
          {cite}
        </div>
      ))}
    </div>
  );
}
