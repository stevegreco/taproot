// Tests the build suite's grader on pages agents wrote in earlier runs, so a grader bug shows up
// here instead of failing a paid run. Calls no model. Needs `pnpm build` (for the web components'
// custom-elements.json) and Playwright's Chromium.
//
// The saved pages are graded against the current components. If a component's API changes on
// purpose, a saved page can stop passing: check the failure, then update the page in its trace.

import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const suite = resolve(here, "..");
const runs = join(suite, "build-runs");
const cases = JSON.parse(readFileSync(join(suite, "build-cases.json"), "utf8"));
const caseById = Object.fromEntries(cases.map((c) => [c.id, c]));

/** Every page saved in build-runs, from the end of each transcript. */
const savedPages = ["baseline", "v1", "v2"].flatMap((variant) =>
  readdirSync(join(runs, variant, "traces")).map((file) => {
    const trace = JSON.parse(readFileSync(join(runs, variant, "traces", file), "utf8"));
    const page = trace.findLast((entry) => entry.role === "page");
    return { variant, id: file.replace(/_rep\d+\.json$/, ""), html: page.content };
  }),
);
const pageFor = (id) => savedPages.find((page) => page.id === id && page.variant === "baseline");

// The grader reads the manifest from the eval project. Point it at a stand-in project whose web
// components package is this repository's.
let project;
let grade;
beforeAll(async () => {
  project = mkdtempSync(join(tmpdir(), "taproot-grade-test-"));
  mkdirSync(join(project, "node_modules/@taproot-ds"), { recursive: true });
  symlinkSync(
    resolve(suite, "../../packages/components"),
    join(project, "node_modules/@taproot-ds/web-components"),
  );
  process.env.TAPROOT_EVAL_PROJECT = project;
  ({ grade } = await import("../build-case.mjs"));
});
afterAll(() => rmSync(project, { recursive: true, force: true }));

describe("build grader", () => {
  it("passes every page saved from earlier runs", async () => {
    expect(savedPages).toHaveLength(cases.length * 3);
    for (const page of savedPages) {
      const result = await grade(caseById[page.id], { output: page.html });
      expect(result.explanation, `${page.variant} ${page.id}`).toBeUndefined();
      expect(result.grade.correct).toBe(1);
    }
  });

  it("fails a variant value the component does not have", async () => {
    const { html } = pageFor("build-settings-delete-account");
    const changed = html.replace('variant="destructive"', 'variant="danger"');
    const { grade: scores, explanation } = await grade(caseById["build-settings-delete-account"], {
      output: changed,
    });
    expect(scores.api).toBe(0);
    expect(explanation.api).toMatch(/ds-button variant="danger" is not one of/);
  });

  it("fails an attribute the component does not have", async () => {
    const { html } = pageFor("build-settings-delete-account");
    const changed = html.replace('variant="destructive"', 'variant="destructive" tone="loud"');
    const { grade: scores, explanation } = await grade(caseById["build-settings-delete-account"], {
      output: changed,
    });
    expect(scores.api).toBe(0);
    expect(explanation.api).toMatch(/ds-button has no attribute tone/);
  });

  it("fails a form control without a label", async () => {
    const { html } = pageFor("build-address-form");
    const changed = html.replace(/(<ds-text-field[^>]*?)\slabel="[^"]*"/, "$1");
    const { grade: scores, explanation } = await grade(caseById["build-address-form"], {
      output: changed,
    });
    expect(scores.rules).toBe(0);
    expect(explanation.rules).toMatch(/pattern\.form-field#visible-label/);
  });

  it("fails a page that does not load the token stylesheet", async () => {
    const { html } = pageFor("build-address-form");
    const changed = html.replace(/<link[^>]*@taproot-ds\/tokens[^>]*>/g, "");
    const { grade: scores, explanation } = await grade(caseById["build-address-form"], {
      output: changed,
    });
    expect(scores.setup).toBe(0);
    expect(explanation.setup).toMatch(/token stylesheet/);
  });

  it("scores no page as nothing written", async () => {
    const { grade: scores } = await grade(caseById["build-address-form"], { output: null });
    expect(scores).toMatchObject({ wrote_page: 0, correct: 0 });
  });
});
