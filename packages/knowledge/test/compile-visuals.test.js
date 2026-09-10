import assert from "node:assert/strict";
import { test } from "node:test";
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

const buttonResolution = {
  suppress: { disabled: ["hover", "pressed"] },
  overlay: ["hover", "pressed"],
  independent: ["focus-visible"],
};

function visualContract(visuals, extras = {}) {
  return portableContract({
    anatomy: [{ name: "control", role: "interactive-surface", description: "Control." }],
    parameters: {
      variant: { kind: "enum", values: { ghost: "Ghost.", primary: "Primary." } },
      size: { kind: "enum", values: { sm: "Small.", md: "Medium." } },
    },
    configurationAxes: { prefersReducedMotion: { values: ["reduce"] } },
    states: ["default", "hover", "pressed", "focus-visible", "disabled"],
    stateResolution: buttonResolution,
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
      states: { "focus-visible": { outline: "component.fixture.focus" } },
      size: { md: { "padding-inline": "component.fixture.pad" } },
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
  assert.equal(
    mappings.find((row) => row.channel === "padding-inline").state,
    undefined,
  );
  const ghostDefault = mappings.find(
    (row) => row.channel === "background" && row.state === "default" && row.configuration?.variant === "ghost",
  );
  assert.deepEqual(ghostDefault.token, { literal: "transparent" });
  const ghostHover = mappings.find(
    (row) => row.channel === "background" && row.state === "hover" && row.configuration?.variant === "ghost",
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

test("reordering contract.states does not change resolved visuals", () => {
  const visuals = {
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
  const ordered = expandVisuals(visualContract(visuals), "component.fixture");
  const reversed = expandVisuals(
    visualContract(visuals, {
      states: ["disabled", "focus-visible", "pressed", "hover", "default"],
    }),
    "component.fixture",
  );
  const options = { configuration: { variant: "ghost" }, states: ["hover", "disabled"] };
  assert.deepEqual(
    resolveMappings(ordered.mappings, buttonResolution, options).channels.background.token,
    { literal: "transparent" },
  );
  assert.deepEqual(
    resolveMappings(reversed.mappings, buttonResolution, options).channels.background.token,
    { literal: "transparent" },
  );
});

test("Ghost hover plus disabled keeps the disabled background, not hover", () => {
  const { mappings, problems } = expandVisuals(
    visualContract({
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
    }),
    "component.fixture",
  );
  assert.deepEqual(problems, []);
  const resolved = resolveMappings(mappings, buttonResolution, {
    configuration: { variant: "ghost" },
    states: ["hover", "disabled"],
  });
  assert.deepEqual(resolved.problems, []);
  assert.deepEqual(resolved.channels.background.token, { literal: "transparent" });
  assert.deepEqual(resolved.channels.foreground.token, token("component.fixture.disabled"));
});

test("disabled plus focus-visible keeps the focus outline", () => {
  const { mappings } = expandVisuals(
    visualContract({
      control: {
        states: { "focus-visible": { outline: "component.fixture.focus" } },
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
  const resolved = resolveMappings(mappings, buttonResolution, {
    configuration: { variant: "ghost" },
    states: ["disabled", "focus-visible"],
  });
  assert.deepEqual(resolved.channels.foreground.token, token("component.fixture.disabled"));
  assert.deepEqual(resolved.channels.outline.token, token("component.fixture.focus"));
});

test("reduced-motion transition none clears duration and easing", () => {
  const { mappings } = expandVisuals(
    visualContract({
      control: {
        base: {
          "transition-duration": "component.fixture.duration",
          "transition-timing-function": "component.fixture.easing",
        },
        prefersReducedMotion: {
          reduce: { transition: "none" },
        },
      },
    }),
    "component.fixture",
  );
  const rest = resolveMappings(mappings, buttonResolution, { configuration: {} });
  assert.equal(rest.channels["transition-duration"].token.name, "component.fixture.duration");
  const reduced = resolveMappings(mappings, buttonResolution, {
    configuration: { prefersReducedMotion: "reduce" },
  });
  assert.deepEqual(reduced.channels.transition.token, { literal: "none" });
  assert.equal(Object.hasOwn(reduced.channels, "transition-duration"), false);
  assert.equal(Object.hasOwn(reduced.channels, "transition-timing-function"), false);
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
        states: { selected: { outline: "component.fixture.focus" } },
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

test("authoring visuals and mappings together is a conflict", () => {
  const { problems } = compileContractVisuals(
    visualContract(
      { control: { base: { radius: "component.fixture.radius" } } },
      {
        mappings: [
          {
            part: "control",
            channel: "radius",
            token: { name: "component.fixture.other" },
          },
        ],
      },
    ),
    "component.fixture",
  );
  assert.ok(problems.some((item) => /both visuals and mappings/.test(item.message)));
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
  assert.equal(button.contract.specVersion, 4);
  assert.deepEqual(button.contract.stateResolution.suppress.disabled, ["hover", "pressed"]);
  const ghostRest = button.contract.mappings.find(
    (row) =>
      row.configuration?.variant === "ghost" && row.channel === "background" && row.state === "default",
  );
  assert.deepEqual(ghostRest.token, { literal: "transparent" });
  const ghostHoverDisabled = resolveMappings(button.contract.mappings, button.contract.stateResolution, {
    configuration: { variant: "ghost", size: "md" },
    states: ["hover", "disabled"],
  });
  assert.deepEqual(ghostHoverDisabled.channels.background.token, { literal: "transparent" });
  assert.equal(
    ghostHoverDisabled.channels.foreground.token.name,
    "component.button.ghost.foreground.disabled",
  );
  const ghostHover = resolveMappings(button.contract.mappings, button.contract.stateResolution, {
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
    "/contract/visuals/control/base/background/token/name",
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
                lg: { "padding-inline": "component.size.size.large.paddingInline" },
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
    buttonResolution,
    {},
  );
  assert.throws(
    () => resolved.channels,
    /pass \{ part \} to read channels/,
  );
  assert.equal(resolved.parts.content.foreground.token.name, "component.fixture.content.fg");
  assert.equal(resolved.parts.control.foreground.token.name, "component.fixture.control.fg");
  assert.equal(
    resolveMappings(
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
      buttonResolution,
      { part: "content" },
    ).channels.foreground.token.name,
    "component.fixture.content.fg",
  );
});

test("independent states cannot share a channel with overlay or suppress winners", () => {
  const { problems } = expandVisuals(
    visualContract({
      control: {
        states: { "focus-visible": { background: "component.fixture.focus" } },
        variant: {
          ghost: {
            background: "transparent",
            states: { hover: { background: "component.fixture.hover" } },
          },
        },
      },
    }),
    "component.fixture",
  );
  assert.ok(problems.some((item) => /independent state focus-visible cannot share/.test(item.message)));
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
  assert.equal(
    button.contract.mappings.some(
      (row) =>
        row.configuration?.variant === "ghost" &&
        row.channel === "background" &&
        row.state === "disabled",
    ),
    false,
  );
  assert.equal(Object.hasOwn(button.contract.mappings[0], "source"), false);
});
