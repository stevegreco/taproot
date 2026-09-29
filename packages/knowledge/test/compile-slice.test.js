import assert from "node:assert/strict";
import { globSync } from "node:fs";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { compile, resolveMappings } from "../src/compile/index.js";
import { repoRoot } from "./helpers/workspace.js";

const contentRoot = join(dirname(fileURLToPath(import.meta.url)), "../content");

test("the authored slice compiles with contracts, ghost tokens, rewritten links, and assets", async () => {
  const authoredCount =
    globSync("**/*.md", { cwd: contentRoot }).length +
    globSync("**/*.spec.yaml", { cwd: contentRoot }).length;
  const outDir = await mkdtemp(join(tmpdir(), "knowledge-slice-"));
  const result = await compile({
    workspaceRoot: repoRoot,
    outDir,
    buildTime: new Date(0),
    revision: "slice",
  });

  assert.equal(result.warnings.filter((item) => item.severity === "error").length, 0);

  const records = JSON.parse(await readFile(join(outDir, "public/records.json"), "utf8"));
  const manifest = JSON.parse(await readFile(join(outDir, "public/manifest.json"), "utf8"));
  assert.equal(manifest.content.recordCount, authoredCount);
  assert.equal(manifest.content.visibility, "public");
  assert.ok(manifest.content.files.some((entry) => entry.path === "schema/knowledge-record.json"));
  assert.equal(records.length, authoredCount);

  const button = records.find((record) => record.id === "component.button");
  assert.ok(button.contract.parameters.variant.values.primary);
  assert.equal(Object.hasOwn(button.contract, "tagName"), false);
  const ghostRestFill = button.contract.mappings.find(
    (row) =>
      row.configuration?.variant === "ghost" &&
      row.channel === "background" &&
      row.state === undefined,
  );
  assert.equal(ghostRestFill.token.literal, "transparent");
  assert.equal(Object.hasOwn(button.contract, "visuals"), false);

  const badge = records.find((record) => record.id === "component.badge");
  assert.equal(Object.hasOwn(badge.contract, "tagName"), false);
  assert.equal(badge.contract.parameters.variant.default, "default");
  assert.equal(Object.hasOwn(badge, "tokens"), false);
  assert.equal(Object.hasOwn(badge, "tokenRef"), false);
  assert.ok(badge.contract.mappings.length > 0);
  assert.equal(Object.hasOwn(badge, "decisions"), false);
  assert.equal(
    badge.sources.some((source) => source.kind === "adr"),
    true,
  );

  const textField = records.find((record) => record.id === "component.text-field");
  assert.equal(Object.hasOwn(textField, "tokens"), false);
  assert.equal(Object.hasOwn(textField.contract, "visuals"), false);
  assert.ok(textField.contract.mappings.length > 0);
  const invalidControl = resolveMappings(textField.contract.mappings, textField.contract.states, {
    part: "control",
    states: ["hover", "invalid"],
  });
  assert.equal(
    invalidControl.channels.border.token.name,
    "semantic.color.border.status.danger.default",
  );
  const disabledControl = resolveMappings(textField.contract.mappings, textField.contract.states, {
    part: "control",
    states: ["hover", "invalid", "disabled"],
  });
  assert.equal(disabledControl.channels.border.token.name, "semantic.color.border.disabled");
  const focusedInvalid = resolveMappings(textField.contract.mappings, textField.contract.states, {
    part: "control",
    states: ["invalid", "focus"],
  });
  assert.equal(focusedInvalid.channels["focus-ring"].token.name, "semantic.color.border.focus");
  assert.equal(
    focusedInvalid.channels.border.token.name,
    "semantic.color.border.status.danger.default",
  );

  const link = records.find((record) => record.id === "component.link");
  assert.equal(Object.hasOwn(link, "tokens"), false);
  assert.equal(Object.hasOwn(link.contract, "visuals"), false);
  assert.equal(link.contract.parameters.variant.default, "inline");
  const hoveredInline = resolveMappings(link.contract.mappings, link.contract.states, {
    part: "control",
    configuration: { variant: "inline" },
    states: ["hover", "focus"],
  });
  assert.equal(hoveredInline.channels.foreground.token.name, "semantic.color.foreground.default");
  assert.equal(hoveredInline.channels["focus-ring"].token.name, "semantic.color.border.focus");
  assert.equal(hoveredInline.channels["font-size"].token.literal, "inherit");
  const standalone = resolveMappings(link.contract.mappings, link.contract.states, {
    part: "control",
    configuration: { variant: "standalone" },
  });
  assert.equal(
    standalone.channels["font-size"].token.name,
    "semantic.typography.label.default.fontSize",
  );

  const byId = (id) => records.find((record) => record.id === id);
  assert.equal(byId("component.button").web.defaultTagName, "ds-button");
  assert.equal(byId("component.text-field").web.defaultTagName, "ds-text-field");
  const linkWeb = byId("component.link").web;
  assert.equal(linkWeb.defaultTagName, "ds-link");
  assert.equal(Object.hasOwn(linkWeb, "formAssociation"), false);
  // Link has no accessibleName parameter, so its text is the only name source.
  assert.equal(linkWeb.anatomy.content.accepts.includes("decorative-icon"), false);
  assert.equal(
    records.some((record) => record.type === "binding"),
    false,
  );

  const buttonMarkdown = await readFile(
    join(outDir, "public/markdown/component.button.md"),
    "utf8",
  );
  assert.equal(button.bodyOrigin, "generated");
  assert.match(button.body, /markdown\/pattern\.action-hierarchy\.md#assign-emphasis/);
  assert.match(buttonMarkdown, /\]\(pattern\.action-hierarchy\.md#assign-emphasis\)/);
  assert.doesNotMatch(buttonMarkdown, /markdown\/pattern\.action-hierarchy\.md/);
  assert.doesNotMatch(buttonMarkdown, /\.\.\/patterns\/action-hierarchy\.md/);
  assert.doesNotMatch(buttonMarkdown, /^contract:/m);
  assert.doesNotMatch(buttonMarkdown, /^host:/m);
  assert.doesNotMatch(buttonMarkdown, /^checks:/m);
  // The file alone answers which variant, which tokens, and where the implementation is.
  assert.match(buttonMarkdown, /^ {2}- `danger`: Destructive or difficult-to-reverse action\.$/m);
  assert.match(
    buttonMarkdown,
    /^\| control \| background \| variant=danger, hover \| `component\.button\.danger\.background\.hover` \| `background-color: var\(--component-button-danger-background-hover\)` \|$/m,
  );
  assert.doesNotMatch(buttonMarkdown, /^web:/m);
  // The file alone says how to install, register, and use the element.
  assert.match(buttonMarkdown, /^import "@stevegreco\/design-system\/css";$/m);
  assert.match(
    buttonMarkdown,
    /^import \{ defineButton \} from "@stevegreco\/design-system-components\/button";$/m,
  );
  assert.match(buttonMarkdown, /^defineButton\(\); \/\/ registers <ds-button>$/m);
  assert.match(buttonMarkdown, /^\| action \| `type` \| `type` \| activate → `button`/m);
  assert.match(
    buttonMarkdown,
    /^- `click` for activate\. Not fired while disabled, including inside a disabled fieldset\.$/m,
  );
  assert.match(buttonMarkdown, /^- The default slot holds `content` and is required\./m);
  assert.match(buttonMarkdown, /^- `::part\(button\)`: The inner native button control\.$/m);
  assert.match(
    buttonMarkdown,
    /^- \[Action hierarchy\]\(pattern\.action-hierarchy\.md\) \(pattern\)$/m,
  );
  assert.match(buttonMarkdown, /## Example\n\n```html\n<ds-button variant="primary">/);

  const example = records.find((record) => record.id === "example.action-hierarchy.settings");
  const assetPath = example.assets[0].bundlePath;
  const svg = await readFile(join(outDir, "public", assetPath), "utf8");
  assert.match(svg, /<svg/);
  assert.match(example.body, new RegExp(assetPath.replaceAll(".", "\\.")));

  const exampleMarkdown = await readFile(
    join(outDir, "public/markdown/example.action-hierarchy.settings.md"),
    "utf8",
  );
  assert.match(exampleMarkdown, /\]\(\.\.\/assets\/[^)]+\)/);
  assert.doesNotMatch(exampleMarkdown, /\]\(assets\//);
});
