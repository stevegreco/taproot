import assert from "node:assert/strict";
import { test } from "vitest";
import { PROBLEM, buildCorpus } from "../src/compile/corpus.js";
import { compileContractVisuals, expandVisuals, resolveMappings } from "../src/compile/visuals.js";
import {
  codes,
  createFsReader,
  createMemoryReader,
  portableContract,
  recordMarkdown,
  repoRoot,
} from "./helpers/workspace.js";

/** Highest priority first, as Button lists them. */
const STATES = ["disabled", "pressed", "hover", "focus", "default"];

function visualContract(visuals, extras = {}) {
  return portableContract({
    anatomy: [{ name: "control", role: "interactive-surface", description: "Control." }],
    parameters: {
      variant: { kind: "enum", values: { ghost: "Ghost.", primary: "Primary." } },
      size: { kind: "enum", values: { sm: "Small.", md: "Medium." } },
    },
    configurationAxes: { reducedMotion: { values: ["reduce"] } },
    states: STATES,
    visuals,
    ...extras,
  });
}

function token(name) {
  return { name };
}

test("compact visuals expand into deterministic mapping rows", () => {
  const contract = visualContract({
    control: {
      base: { radius: "component.fixture.radius" },
      states: { focus: { "focus-ring": "component.fixture.focus" } },
      size: { md: { "padding-horizontal": "component.fixture.pad" } },
      variant: {
        ghost: {
          background: "transparent",
          foreground: "component.fixture.ghost.fg",
          border: "transparent",
          states: {
            hover: { background: "component.fixture.ghost.hover" },
            disabled: { foreground: "component.fixture.ghost.disabled" },
          },
        },
      },
    },
  });
  const { mappings, problems } = expandVisuals(contract, "component.fixture");
  assert.deepEqual(problems, []);
  const radius = mappings.find((row) => row.channel === "radius");
  assert.equal(radius.part, "control");
  assert.deepEqual(radius.token, token("component.fixture.radius"));
  assert.equal(radius.source, "/contract/visuals/control/base/radius");
  assert.equal(mappings.find((row) => row.channel === "padding-horizontal").state, undefined);
  const ghostRest = mappings.find(
    (row) =>
      row.channel === "background" &&
      row.state === undefined &&
      row.configuration?.variant === "ghost",
  );
  assert.deepEqual(ghostRest.token, { literal: "transparent" });
  assert.equal(
    mappings.some((row) => row.state === "default"),
    false,
  );
  const ghostHover = mappings.find(
    (row) =>
      row.channel === "background" &&
      row.state === "hover" &&
      row.configuration?.variant === "ghost",
  );
  assert.deepEqual(ghostHover.token, token("component.fixture.ghost.hover"));
  assert.equal(
    mappings.some((row) => row.channel === "border" && row.state === "hover"),
    false,
  );
});

test("YAML object order does not change expanded mappings", () => {
  const first = expandVisuals(
    visualContract({
      control: {
        variant: {
          ghost: {
            background: "transparent",
            states: {
              hover: { background: "component.fixture.hover" },
              pressed: { background: "component.fixture.pressed" },
            },
          },
        },
      },
    }),
    "component.fixture",
  );
  const second = expandVisuals(
    visualContract({
      control: {
        variant: {
          ghost: {
            states: {
              pressed: { background: "component.fixture.pressed" },
              hover: { background: "component.fixture.hover" },
            },
            background: "transparent",
          },
        },
      },
    }),
    "component.fixture",
  );
  assert.deepEqual(first.problems, []);
  assert.deepEqual(second.problems, []);
  assert.deepEqual(first.mappings, second.mappings);
});

const ghostVisuals = {
  control: {
    variant: {
      ghost: {
        background: "transparent",
        foreground: "component.fixture.fg",
        states: {
          hover: { background: "component.fixture.hover" },
          disabled: { foreground: "component.fixture.disabled" },
        },
      },
    },
  },
};
const ghostHoverDisabled = { configuration: { variant: "ghost" }, states: ["hover", "disabled"] };

test("the first active state in contract.states wins each channel it sets", () => {
  const { mappings, problems } = expandVisuals(visualContract(ghostVisuals), "component.fixture");
  assert.deepEqual(problems, []);
  const resolved = resolveMappings(mappings, STATES, ghostHoverDisabled);
  assert.deepEqual(resolved.channels.foreground.token, token("component.fixture.disabled"));
  // Disabled sets no background, so the hover background shows through.
  assert.deepEqual(resolved.channels.background.token, token("component.fixture.hover"));

  const hoverFirst = resolveMappings(
    mappings,
    ["hover", "disabled", "pressed", "focus", "default"],
    ghostHoverDisabled,
  );
  assert.deepEqual(hoverFirst.channels.foreground.token, token("component.fixture.disabled"));
  assert.deepEqual(hoverFirst.channels.background.token, token("component.fixture.hover"));
});

test("a state hides a lower one by setting the same channel", () => {
  const visuals = structuredClone(ghostVisuals);
  visuals.control.variant.ghost.states.disabled.background = "transparent";
  const { mappings } = expandVisuals(visualContract(visuals), "component.fixture");
  const resolved = resolveMappings(mappings, STATES, ghostHoverDisabled);
  assert.deepEqual(resolved.channels.background.token, { literal: "transparent" });
  assert.deepEqual(resolved.channels.foreground.token, token("component.fixture.disabled"));
});

test("default comes last in contract.states and has no states block", () => {
  const misordered = compileContractVisuals(
    visualContract(ghostVisuals, { states: ["default", "hover", "disabled"] }),
    "component.fixture",
  );
  assert.ok(misordered.problems.some((item) => /must come last/.test(item.message)));
  const { problems } = expandVisuals(
    visualContract({ control: { states: { default: { background: "transparent" } } } }),
    "component.fixture",
  );
  assert.ok(problems.some((item) => /go outside states/.test(item.message)));
});

test("disabled plus focus keeps the focus ring", () => {
  const { mappings } = expandVisuals(
    visualContract({
      control: {
        states: { focus: { "focus-ring": "component.fixture.focus" } },
        variant: {
          ghost: {
            background: "transparent",
            foreground: "component.fixture.fg",
            states: {
              disabled: { foreground: "component.fixture.disabled" },
            },
          },
        },
      },
    }),
    "component.fixture",
  );
  const resolved = resolveMappings(mappings, STATES, {
    configuration: { variant: "ghost" },
    states: ["disabled", "focus"],
  });
  assert.deepEqual(resolved.channels.foreground.token, token("component.fixture.disabled"));
  assert.deepEqual(resolved.channels["focus-ring"].token, token("component.fixture.focus"));
});

test("reduced-motion transition none clears duration and easing", () => {
  const { mappings } = expandVisuals(
    visualContract({
      control: {
        base: {
          "motion-duration": "component.fixture.duration",
          "motion-easing": "component.fixture.easing",
        },
        reducedMotion: {
          reduce: { motion: "none" },
        },
      },
    }),
    "component.fixture",
  );
  const rest = resolveMappings(mappings, STATES, { configuration: {} });
  assert.equal(rest.channels["motion-duration"].token.name, "component.fixture.duration");
  const reduced = resolveMappings(mappings, STATES, {
    configuration: { reducedMotion: "reduce" },
  });
  assert.deepEqual(reduced.channels.motion.token, { literal: "none" });
  assert.equal(Object.hasOwn(reduced.channels, "motion-duration"), false);
  assert.equal(Object.hasOwn(reduced.channels, "motion-easing"), false);
});

test("incomparable axis assignments for one channel are a conflict", () => {
  const { problems } = expandVisuals(
    visualContract({
      control: {
        size: { md: { background: "component.fixture.size" } },
        variant: { ghost: { background: "component.fixture.variant" } },
      },
    }),
    "component.fixture",
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0].message, /overlapping/);
});

test("unknown parts, axes, states, and literals fail closed", () => {
  const { problems } = expandVisuals(
    visualContract({
      missing: { base: { radius: "component.fixture.radius" } },
      control: {
        tone: { loud: { background: "component.fixture.bg" } },
        states: { selected: { "focus-ring": "component.fixture.focus" } },
        base: { background: "currentColor" },
      },
    }),
    "component.fixture",
  );
  assert.ok(problems.some((item) => /part missing/.test(item.message)));
  assert.ok(problems.some((item) => /axis tone/.test(item.message)));
  assert.ok(problems.some((item) => /state selected/.test(item.message)));
  const compiled = compileContractVisuals(
    visualContract({
      control: { base: { background: "currentColor" } },
    }),
    "component.fixture",
  );
  const named = compiled.contract.mappings.find((row) => row.channel === "background");
  assert.equal(named.token.name, "currentColor");
});

test("mappings and visualCoverage cannot be authored", () => {
  const { contract, problems } = compileContractVisuals(
    portableContract({
      anatomy: [{ name: "control", role: "interactive-surface", description: "Control." }],
      mappings: [{ part: "control", channel: "radius", token: { name: "component.fixture.r" } }],
      visualCoverage: { parts: {}, uncoveredParts: [], uncoveredAxes: [] },
    }),
    "component.fixture",
  );
  assert.deepEqual(
    problems.map((item) => item.path),
    ["/contract/mappings", "/contract/visualCoverage"],
  );
  assert.equal(Object.hasOwn(contract, "mappings"), false);
});

test("compiled Button mappings omit visuals and preserve ghost rest fill", async () => {
  const corpus = await buildCorpus(
    createFsReader(repoRoot),
    [{ root: `${repoRoot}/packages/knowledge/content`, visibility: "public" }],
    { workspaceRoot: repoRoot },
  );
  assert.equal(
    corpus.problems.filter((item) => item.severity === "error").length,
    0,
    JSON.stringify(corpus.problems, null, 2),
  );
  const button = corpus.records.get("component.button");
  assert.equal(Object.hasOwn(button.contract, "visuals"), false);
  assert.equal(button.contract.specVersion, 5);
  assert.deepEqual(button.contract.states, ["disabled", "pressed", "hover", "focus", "default"]);
  const ghostRest = button.contract.mappings.find(
    (row) =>
      row.configuration?.variant === "ghost" &&
      row.channel === "background" &&
      row.state === undefined,
  );
  assert.deepEqual(ghostRest.token, { literal: "transparent" });
  const ghostHoverDisabled = resolveMappings(button.contract.mappings, button.contract.states, {
    configuration: { variant: "ghost", size: "md" },
    states: ["hover", "disabled"],
  });
  assert.deepEqual(ghostHoverDisabled.channels.background.token, { literal: "transparent" });
  assert.equal(
    ghostHoverDisabled.channels.foreground.token.name,
    "component.button.ghost.foreground.disabled",
  );
  const ghostHover = resolveMappings(button.contract.mappings, button.contract.states, {
    configuration: { variant: "ghost", size: "md" },
    states: ["hover"],
  });
  assert.equal(
    ghostHover.channels.background.token.name,
    "component.button.ghost.background.hover",
  );
});

test("a visuals token missing from the token package fails the build", async () => {
  const componentPath = "content/missing-visual.md";
  const corpus = await buildCorpus(
    createMemoryReader({
      [componentPath]: recordMarkdown({
        id: "component.missing-visual",
        sources: [{ kind: "authored", path: componentPath }],
        contract: visualContract({
          control: { base: { background: "semantic.color.does.not.exist" } },
        }),
      }),
    }),
    [{ root: "content", visibility: "public" }],
    { workspaceRoot: repoRoot },
  );
  assert.ok(
    codes(corpus, PROBLEM.SOURCE_CONFLICT).some((item) =>
      /semantic\.color\.does\.not\.exist/.test(item.message),
    ),
  );
  assert.equal(
    codes(corpus, PROBLEM.SOURCE_CONFLICT).find((item) =>
      /semantic\.color\.does\.not\.exist/.test(item.message),
    ).path,
    "content/missing-visual.md:57 /contract/visuals/control/base/background",
  );
});

test("an extra contract size compiles from compact visuals", async () => {
  const componentPath = "content/size.md";
  const corpus = await buildCorpus(
    createMemoryReader({
      [componentPath]: recordMarkdown({
        id: "component.size-visual",
        sources: [
          { kind: "authored", path: componentPath },
          { kind: "token-source", path: "packages/tokens/size.json" },
        ],
        contract: portableContract({
          description: "Extra contract size.",
          anatomy: [
            { name: "control", role: "interactive-surface", description: "Interactive control." },
          ],
          parameters: {
            size: { kind: "enum", values: { sm: "Small.", md: "Medium.", lg: "Large." } },
          },
          visuals: {
            control: {
              size: {
                lg: { "padding-horizontal": "component.size.size.large.paddingInline" },
              },
            },
          },
        }),
        tokenRef: {
          tier: "component",
          namespace: "component.size",
          description: "Size tokens.",
        },
      }),
      "packages/tokens/size.json": JSON.stringify({
        component: {
          size: {
            size: {
              large: { paddingInline: { $value: "24px", $type: "dimension" } },
            },
          },
        },
      }),
    }),
    [{ root: "content", visibility: "public" }],
  );
  assert.equal(
    corpus.problems.filter((item) => item.severity === "error").length,
    0,
    JSON.stringify(corpus.problems, null, 2),
  );
  const record = corpus.records.get("component.size-visual");
  assert.equal(record.contract.mappings[0].token.name, "component.size.size.large.paddingInline");
  assert.equal(record.contract.mappings[0].configuration.size, "lg");
  assert.equal(Object.hasOwn(record.contract, "visuals"), false);
  assert.deepEqual(record.contract.visualCoverage.parts.control.missingValues.size, ["md", "sm"]);
  assert.deepEqual(
    codes(corpus, PROBLEM.VISUAL_MISSING_VALUE).map((item) => [item.severity, item.message]),
    [
      ["warning", "component.size-visual part control has visuals for size but none for size=md"],
      ["warning", "component.size-visual part control has visuals for size but none for size=sm"],
    ],
  );
  assert.equal(Object.hasOwn(record.contract.mappings[0], "source"), false);
});

test("resolveMappings keeps the same channel on two anatomy parts", () => {
  const resolved = resolveMappings(
    [
      {
        part: "content",
        channel: "foreground",
        token: { name: "component.fixture.content.fg" },
      },
      {
        part: "control",
        channel: "foreground",
        token: { name: "component.fixture.control.fg" },
      },
    ],
    STATES,
    {},
  );
  assert.throws(() => resolved.channels, /pass \{ part \} to read channels/);
  assert.equal(Object.getOwnPropertyDescriptor(resolved, "channels").enumerable, false);
  const serialized = JSON.parse(JSON.stringify(resolved));
  assert.equal(Object.hasOwn(serialized, "channels"), false);
  assert.deepEqual(serialized.parts.content.foreground.token, {
    name: "component.fixture.content.fg",
  });
  assert.equal(Object.hasOwn({ ...resolved }, "channels"), false);
  assert.equal(resolved.parts.content.foreground.token.name, "component.fixture.content.fg");
  assert.equal(resolved.parts.control.foreground.token.name, "component.fixture.control.fg");
  const content = resolveMappings(
    [
      {
        part: "content",
        channel: "foreground",
        token: { name: "component.fixture.content.fg" },
      },
      {
        part: "control",
        channel: "foreground",
        token: { name: "component.fixture.control.fg" },
      },
    ],
    STATES,
    { part: "content" },
  );
  assert.equal(content.channels.foreground.token.name, "component.fixture.content.fg");
  assert.equal(Object.getOwnPropertyDescriptor(content, "channels").enumerable, true);
  assert.equal(
    JSON.parse(JSON.stringify(content)).channels.foreground.token.name,
    "component.fixture.content.fg",
  );
});

test("compiled Button coverage lists unused parts and axes without failing them", async () => {
  const corpus = await buildCorpus(
    createFsReader(repoRoot),
    [{ root: `${repoRoot}/packages/knowledge/content`, visibility: "public" }],
    { workspaceRoot: repoRoot },
  );
  const button = corpus.records.get("component.button");
  assert.deepEqual(button.contract.visualCoverage.uncoveredParts, ["content"]);
  assert.deepEqual(button.contract.visualCoverage.uncoveredAxes, [
    "accessibleName",
    "action",
    "disabled",
    "fullWidth",
  ]);
  assert.equal(Object.hasOwn(button.contract.visualCoverage.parts.control, "missingValues"), false);
  // Disabled sets the ghost background, so hover cannot show through it.
  assert.deepEqual(
    button.contract.mappings.find(
      (row) =>
        row.configuration?.variant === "ghost" &&
        row.channel === "background" &&
        row.state === "disabled",
    ).token,
    { literal: "transparent" },
  );
  assert.equal(Object.hasOwn(button.contract.mappings[0], "source"), false);
});
