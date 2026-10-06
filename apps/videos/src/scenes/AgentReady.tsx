import { interpolate, useCurrentFrame } from "remotion";
import { Chapter } from "../components/Chapter";
import { Badge, CARD_DROP, CARD_WIDTH, ProjectCard } from "../components/ProjectCard";
import { ease, rise, useEnter } from "../components/motion";
import { color, fonts } from "../theme";
import { SCENES } from "../timeline";

const AGENT_CUES = SCENES.agent.cues;

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
  // Each broken rule from the Addresses chapter turns sage as the agent's decision fixes it.
  const fixed = decisions.map(({ cue }) => ease(frame, cue - 2, 14)) as [number, number, number];
  const verified = useEnter(AGENT_CUES.verified);
  const request = useEnter(8);
  const lift = ease(frame, 18, 24);
  const log = ease(frame, AGENT_CUES.search - 12, 10);
  return (
    <Chapter number="07" name="Agent ready" title="The agent asks first." align="start">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `1fr ${CARD_WIDTH}px`,
          gap: 80,
          alignItems: "start",
        }}
      >
        <div>
          <div style={{ ...rise(request, 12), fontSize: 30, color: color.muted, marginBottom: 22 }}>
            Same request:{" "}
            <span style={{ fontFamily: fonts.display }}>
              “Add an action to delete this project.”
            </span>
          </div>
          <div
            style={{
              opacity: log,
              background: color.ink,
              borderRadius: 14,
              padding: "20px 28px",
              fontFamily: fonts.mono,
              fontSize: 24,
              lineHeight: 1.45,
            }}
          >
            {calls.map((call, i) => (
              <Call key={call.call} {...call} first={i === 0} />
            ))}
          </div>
          {decisions.map((decision, i) => (
            <Decision key={decision.title} n={i + 1} {...decision} />
          ))}
          <div
            style={{
              ...rise(verified),
              marginTop: 20,
              fontSize: 28,
              color: color.sage,
              fontWeight: 600,
            }}
          >
            ✓ Every choice cites a rule.
          </div>
        </div>
        <ProjectCard
          emphasis={emphasis}
          label={label}
          placement={placement}
          marks={[1, 1, 1]}
          fixed={fixed}
          style={{ translate: `0 ${(1 - lift) * CARD_DROP}px` }}
        />
      </div>
    </Chapter>
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

/** A decision, numbered to match the mark it fixes on the card. */
function Decision({
  n,
  title,
  cites,
  cue,
}: {
  n: number;
  title: string;
  cites: string[];
  cue: number;
}) {
  const p = useEnter(cue - 8);
  return (
    <div
      style={{
        ...rise(p, 12),
        position: "relative",
        padding: "16px 0 16px 58px",
        borderBottom: `1px solid ${color.line}`,
      }}
    >
      <Badge n={n} p={1} tone={color.sage} style={{ left: 0, top: 16 }} />
      <div style={{ fontSize: 30, fontWeight: 600 }}>{title}</div>
      {cites.map((cite) => (
        <div
          key={cite}
          style={{ fontFamily: fonts.mono, fontSize: 21, color: color.sage, marginTop: 6 }}
        >
          {cite}
        </div>
      ))}
    </div>
  );
}
