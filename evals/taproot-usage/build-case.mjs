// The build suite: each case asks an agent to build a page with Taproot's web components, and the
// grade checks the HTML it writes. run-eval.mjs runs it with TAPROOT_EVAL_SUITE=build.
//
// Every setup gets the same file tools, so the agent can read the installed packages as a
// developer would. The CLI and MCP setups add the spec tools on top.

import { copyFileSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { MCP_TOOL_PREFIX, harnessError, parseRun, projectDir, runClaude } from "./taproot-case.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const FILE_TOOLS = ["Read", "Write", "Edit", "Glob", "Grep"];
const PROJECT_CONTEXT =
  "You are helping in a project that uses the Taproot design system. Its packages are installed in node_modules.";
const TASK = `Build the page as one HTML file named index.html in the current directory, with Taproot's web components. There is no bundler: load what the page needs from node_modules. Write the components as markup in the HTML, not from script. When the file is written, reply with one line saying so.`;

export const SETUPS = {
  baseline: {
    name: "control",
    builtInTools: FILE_TOOLS.join(","),
    allowedTools: FILE_TOOLS,
    mcp: false,
    context: PROJECT_CONTEXT,
  },
  v1: {
    name: "cli",
    builtInTools: [...FILE_TOOLS, "Bash"].join(","),
    allowedTools: [...FILE_TOOLS, "Bash(node_modules/.bin/taproot *)"],
    mcp: false,
    context: `${PROJECT_CONTEXT} Its CLI is at node_modules/.bin/taproot, and \`node_modules/.bin/taproot help agents\` explains how to use it.`,
  },
  v2: {
    name: "mcp",
    builtInTools: FILE_TOOLS.join(","),
    allowedTools: [...FILE_TOOLS, `${MCP_TOOL_PREFIX}*`],
    mcp: true,
    context: PROJECT_CONTEXT,
  },
};

/** TAPROOT_EVAL_CASES limits a run to a comma-separated list of ids, for a pilot. */
export async function loadCases() {
  const cases = JSON.parse(readFileSync(join(here, "build-cases.json"), "utf8"));
  const only = process.env.TAPROOT_EVAL_CASES?.split(",");
  return only ? cases.filter((c) => only.includes(c.id)) : cases;
}

/** A fresh folder per run that shares the eval project's installed packages. */
function makeWorkspace() {
  const dir = mkdtempSync(join(tmpdir(), "taproot-build-"));
  symlinkSync(join(projectDir, "node_modules"), join(dir, "node_modules"));
  symlinkSync(join(projectDir, "react-implementation"), join(dir, "react-implementation"));
  copyFileSync(join(projectDir, "spec.config.json"), join(dir, "spec.config.json"));
  copyFileSync(join(projectDir, "package.json"), join(dir, "package.json"));
  return dir;
}

export async function runAgent(c, ctx) {
  const setup = SETUPS[ctx.variant];
  if (!setup) throw harnessError(`no setup for variant ${ctx.variant}`);

  const systemText = `${setup.context}\n\n${TASK}`;
  const workspace = makeWorkspace();
  try {
    const raw = await runClaude(c.prompt, systemText, setup, ctx, workspace, [
      "--add-dir",
      projectDir,
    ]);
    const run = parseRun(raw, setup, systemText, c.prompt);
    let html = null;
    try {
      html = readFileSync(join(workspace, "index.html"), "utf8");
    } catch {
      // Graded as no page.
    }
    run.transcript.push({ role: "page", content: html ?? "(no index.html written)" });
    run.output = html;
    return run;
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
}

// Attributes any element may carry. Anything else on a ds- element must be in the manifest.
const GLOBAL_ATTRIBUTES = new Set([
  "id",
  "class",
  "autofocus",
  "style",
  "slot",
  "hidden",
  "title",
  "lang",
  "dir",
  "tabindex",
  "part",
  "inert",
  "role",
]);

function loadManifest() {
  const file = join(
    projectDir,
    "node_modules/@taproot-ds/web-components/dist/custom-elements.json",
  );
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const elements = {};
  for (const declaration of manifest.modules.flatMap((module) => module.declarations ?? [])) {
    if (!declaration.tagName) continue;
    const attributes = {};
    for (const attribute of declaration.attributes ?? []) {
      const text = attribute.type?.text ?? "";
      const values = text.includes("|")
        ? text.split("|").map((value) => value.trim().replace(/^"|"$/g, ""))
        : null;
      attributes[attribute.name] = values;
    }
    elements[declaration.tagName] = {
      attributes,
      slots: (declaration.slots ?? []).map((slot) => slot.name ?? ""),
    };
  }
  return elements;
}

/**
 * Runs in the browser on a parsed copy of the page (scripts never run in a DOMParser document).
 * Returns the facts the grade needs, so the checks themselves stay in Node.
 */
function inspectPage({ html, checks, tags }) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const textOf = (el) =>
    [el.textContent, el.getAttribute("label"), el.getAttribute("aria-label")]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

  const elements = [...doc.querySelectorAll("*")]
    .filter((el) => el.localName.startsWith("ds-"))
    .map((el) => ({
      tag: el.localName,
      attributes: Object.fromEntries([...el.attributes].map((a) => [a.name, a.value])),
      text: textOf(el),
      ownText: [...el.childNodes]
        .filter((node) => node.nodeType === 3 || node.localName !== "ds-icon")
        .map((node) => node.textContent)
        .join(" ")
        .trim(),
      parentTag: el.parentElement?.localName ?? null,
      options: [...el.querySelectorAll("option")].map((o) => o.getAttribute("value")),
      buttonsInside: el.querySelectorAll("ds-button").length,
      slotted: [...el.children]
        .filter((child) => child.hasAttribute("slot"))
        .map((child) => child.getAttribute("slot")),
    }));

  const counts = Object.fromEntries(
    Object.keys(tags).map((tag) => [tag, doc.querySelectorAll(tag).length]),
  );

  const checkResults = checks.map((check) => {
    let matched = [];
    try {
      matched = [...doc.querySelectorAll(check.selector)];
    } catch {
      return { id: check.id, count: -1 };
    }
    if (check.text) {
      const pattern = new RegExp(check.text, "i");
      matched = matched.filter((el) => pattern.test(textOf(el)));
    }
    return { id: check.id, count: matched.length };
  });

  const sources = [
    ...[...doc.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")),
    ...[...doc.querySelectorAll("link[href]")].map((l) => l.getAttribute("href")),
    ...[...doc.querySelectorAll("script:not([src])")].map((s) => s.textContent),
  ].join("\n");

  return { elements, counts, checkResults, sources };
}

// Form controls whose label parameter is their accessible name.
const LABELLED = [
  "ds-text-field",
  "ds-text-area",
  "ds-select",
  "ds-radio-group",
  "ds-checkbox",
  "ds-switch",
  "ds-slider",
  "ds-progress-bar",
];

/** The MUST rules a script can check on any page, from the elements it uses. */
function ruleFailures(elements) {
  const failures = [];
  const fail = (rule, message) => failures.push(`${rule}: ${message}`);
  for (const el of elements) {
    const a = el.attributes;
    if (LABELLED.includes(el.tag) && !a.label?.trim()) {
      fail("pattern.form-field#visible-label", `${el.tag} has no label`);
    }
    if (el.tag === "ds-button" && !el.ownText && !a["aria-label"]?.trim()) {
      fail("component.button#icon-accessible-name", "a ds-button has no text or aria-label");
    }
    if (el.tag === "ds-dialog") {
      if (!a.label?.trim()) fail("component.dialog#visible-title", "ds-dialog has no label");
      if (!el.buttonsInside) fail("component.dialog#explicit-exit", "ds-dialog has no button");
    }
    if (el.tag === "ds-tabs" && !a.label?.trim()) {
      fail("component.tabs#accessible-tabs", "ds-tabs has no label");
    }
    if (el.tag === "ds-tab-panel" && !a.label?.trim()) {
      fail("component.tabs#labels-short-and-unique", "a ds-tab-panel has no label");
    }
    if (el.tag === "ds-alert" && !el.text) {
      fail("component.alert#text-states-status", "ds-alert has no text");
    }
    if ((el.tag === "ds-select" || el.tag === "ds-radio-group") && !el.options.length) {
      fail("component.select#named-choices", `${el.tag} has no options`);
    }
  }
  const panels = elements.filter((el) => el.tag === "ds-tab-panel");
  const values = panels.map((el) => el.attributes.value ?? el.attributes.label);
  if (new Set(values).size !== values.length) {
    fail("component.tabs#unique-values", "two ds-tab-panel elements share a value");
  }
  return failures;
}

/** Attributes, values, and slots that the manifest does not list. */
function apiFailures(elements, manifest) {
  const failures = [];
  for (const el of elements) {
    const spec = manifest[el.tag];
    if (!spec) {
      failures.push(`${el.tag} is not a Taproot element`);
      continue;
    }
    for (const [name, value] of Object.entries(el.attributes)) {
      if (GLOBAL_ATTRIBUTES.has(name) || name.startsWith("data-") || name.startsWith("on")) {
        continue;
      }
      if (name.startsWith("aria-") && !(name in spec.attributes)) continue;
      if (!(name in spec.attributes)) {
        failures.push(`${el.tag} has no attribute ${name}`);
        continue;
      }
      const allowed = spec.attributes[name];
      if (allowed && !allowed.includes(value)) {
        failures.push(`${el.tag} ${name}="${value}" is not one of ${allowed.join(", ")}`);
      }
    }
    const parent = manifest[el.parentTag];
    if (el.attributes.slot && parent && !parent.slots.includes(el.attributes.slot)) {
      failures.push(`${el.parentTag} has no slot ${el.attributes.slot}`);
    }
  }
  return failures;
}

function setupFailures(sources) {
  const failures = [];
  if (!/@taproot-ds\/web-components/.test(sources)) {
    failures.push("the page does not load @taproot-ds/web-components");
  }
  if (!/@taproot-ds\/tokens/.test(sources)) {
    failures.push("the page does not load the token stylesheet from @taproot-ds/tokens");
  }
  return failures;
}

/** Score the page. Each metric is pass or fail; correct needs all of them. */
export async function grade(c, run) {
  const html = run.output;
  if (!html) {
    const none = { components: 0, api: 0, rules: 0, task: 0, setup: 0, correct: 0, wrote_page: 0 };
    return { grade: none, explanation: { wrote_page: "No index.html was written." } };
  }

  const { tags, checks } = c.expected;
  const browser = await chromium.launch();
  let facts;
  try {
    const page = await browser.newPage();
    facts = await page.evaluate(inspectPage, { html, checks, tags });
  } finally {
    await browser.close();
  }

  const componentMisses = Object.entries(tags)
    .filter(([tag, min]) => facts.counts[tag] < min)
    .map(([tag, min]) => `expected at least ${min} ${tag}, found ${facts.counts[tag]}`);

  const taskMisses = [];
  for (const check of checks) {
    const { count } = facts.checkResults.find((result) => result.id === check.id);
    const tooFew = check.min != null && count < check.min;
    const tooMany = check.max != null && count > check.max;
    if (count < 0 || tooFew || tooMany) {
      taskMisses.push(`${check.id}${check.rule ? ` (${check.rule})` : ""}: ${check.description}`);
    }
  }

  const failures = {
    components: componentMisses,
    api: apiFailures(facts.elements, loadManifest()),
    rules: ruleFailures(facts.elements),
    task: taskMisses,
    setup: setupFailures(facts.sources),
  };
  const grade = Object.fromEntries(
    Object.entries(failures).map(([metric, list]) => [metric, list.length ? 0 : 1]),
  );
  grade.wrote_page = 1;
  grade.correct = Object.values(failures).every((list) => !list.length) ? 1 : 0;

  const explanation = Object.fromEntries(
    Object.entries(failures)
      .filter(([, list]) => list.length)
      .map(([metric, list]) => [metric, list.join("; ")]),
  );
  return { grade, explanation: Object.keys(explanation).length ? explanation : undefined };
}
