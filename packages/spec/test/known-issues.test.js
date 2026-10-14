import { describe, expect, it } from "vitest";
import { validateSpec } from "../src/index.js";
import { issueStates } from "../src/known-issues.js";
import { validate } from "../src/operations.js";
import { fixture } from "./helpers.js";

/** A stand-in for `fetch` that answers GitHub issue lookups from a table of states. */
function fakeGitHub(states) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init });
    const number = Number(url.split("/").at(-1));
    if (!(number in states)) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ state: states[number] }) };
  };
  return { fetch, calls };
}

describe("known issues", () => {
  it("collects each entry with the file and line of its issue", async () => {
    const { knownIssues } = await validateSpec({ contentDir: fixture("valid") });
    expect(knownIssues).toEqual([
      {
        recordId: "component.other",
        file: "other.spec.yaml",
        line: 21,
        path: "/known-issues/0/issue",
        statement: "Its focus ring is too faint on the dark surface.",
        issue: "https://github.com/acme/design-system/issues/12",
      },
      {
        recordId: "component.other",
        file: "other.spec.yaml",
        line: 23,
        path: "/known-issues/1/issue",
        statement: "It flickers in one old browser.",
        issue: "https://tracker.example.com/browse/DS-7",
      },
    ]);
  });

  it("looks up GitHub issues once each, and leaves other trackers unknown", async () => {
    const { fetch, calls } = fakeGitHub({ 12: "closed" });
    const entry = { issue: "https://github.com/acme/design-system/issues/12" };
    const states = await issueStates(
      [entry, entry, { issue: "https://tracker.example.com/browse/DS-7" }],
      { fetch, token: "test-token" },
    );
    expect(states.map((state) => state.state)).toEqual(["closed", "closed", "unknown"]);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.github.com/repos/acme/design-system/issues/12");
    expect(calls[0].init.headers.authorization).toBe("Bearer test-token");
  });

  it("reports a failed lookup as unknown with the reason", async () => {
    const [missing] = await issueStates(
      [{ issue: "https://github.com/acme/design-system/issues/99" }],
      { ...fakeGitHub({}), token: "test-token" },
    );
    expect(missing).toMatchObject({ state: "unknown", reason: "GitHub answered 404" });
    const [offline] = await issueStates(
      [{ issue: "https://github.com/acme/design-system/pull/3" }],
      {
        fetch: async () => {
          throw new Error("network down");
        },
      },
    );
    expect(offline).toMatchObject({ state: "unknown", reason: "network down" });
  });

  it("validate --issues warns about closed issues without failing", async () => {
    const result = await validate({
      contentDir: fixture("valid"),
      checkIssues: true,
      ...fakeGitHub({ 12: "closed" }),
    });
    expect(result.ok).toBe(true);
    const lines = result.text.split("\n");
    expect(lines).toContain(
      "other.spec.yaml:21 /known-issues/0/issue warning: https://github.com/acme/design-system/issues/12 is closed; remove the entry or reopen the issue",
    );
    expect(lines).toContain(
      "other.spec.yaml:23 /known-issues/1/issue warning: could not check https://tracker.example.com/browse/DS-7: only GitHub issue URLs can be checked",
    );
    expect(lines.at(-1)).toBe("Known issues: 2 checked, 1 closed.");
  });

  it("validate without --issues does not touch the network", async () => {
    const { fetch, calls } = fakeGitHub({});
    const result = await validate({ contentDir: fixture("valid"), fetch });
    expect(calls).toHaveLength(0);
    expect(result.text).not.toContain("Known issues");
  });
});
