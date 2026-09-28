import assert from "node:assert/strict";
import { test } from "vitest";
import { KnowledgeRecordError, parseRecord, parseYamlRecord } from "../src/index.js";
import { PROBLEM, buildCorpus } from "../src/compile/corpus.js";
import {
  codes,
  createMemoryReader,
  portableContract,
  recordMarkdown,
  recordYaml,
} from "./helpers/workspace.js";

const buttonPath = "content/components/button/button.spec.yaml";

function yamlComponent(overrides = {}, contractOverrides = {}) {
  return recordYaml({
    id: "component.yaml-button",
    path: buttonPath,
    sources: [{ kind: "authored", path: buttonPath }],
    contract: portableContract({
      usage: {
        do: [{ id: "trigger-action", situation: "Trigger an action in the current view." }],
        avoid: [
          {
            id: "navigation",
            situation: "Navigate to another location.",
            instead: "Link",
            why: "Links provide native navigation semantics.",
          },
        ],
      },
      behavior: [
        {
          id: "disabled-prevents-activation",
          level: "must",
          statement: "Disabled prevents activation.",
        },
      ],
      ...contractOverrides,
    }),
    ...overrides,
  });
}

test("parseYamlRecord accepts a YAML-only component without a body", () => {
  const record = parseYamlRecord(yamlComponent(), { sourcePath: buttonPath });
  assert.equal(record.id, "component.yaml-button");
  assert.equal(record.type, "component");
  assert.equal(Object.hasOwn(record, "body"), false);
  assert.equal(record.contract.specVersion, 5);
  assert.equal(record.contract.usage.avoid[0].instead, "Link");
});

test("parseRecord remains a Markdown parser", () => {
  assert.throws(
    () => parseRecord(yamlComponent(), { sourcePath: buttonPath }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.match(error.message, /YAML frontmatter is missing/);
      return true;
    },
  );
});

test("parseYamlRecord reports a renamed contract field once, with its line", () => {
  const text = yamlComponent().replace(/^  states:/m, "  statez:");
  const line = text.split("\n").findIndex((row) => row.startsWith("  statez:")) + 1;

  assert.throws(
    () => parseYamlRecord(text, { sourcePath: buttonPath }),
    (error) => {
      assert.ok(error instanceof KnowledgeRecordError);
      assert.deepEqual(
        error.issues.map(({ path, message }) => `${path} ${message}`),
        ["/contract/states is required", "/contract/statez is not an allowed field"],
      );
      assert.equal(error.issues[1].line, line);
      assert.equal(error.recordId, "component.yaml-button");
      return true;
    },
  );
});

test("parseYamlRecord reports indentation errors as yaml, not uniqueKeys", () => {
  const yaml = `id: component.yaml-button
schemaVersion: 1
type: component
title: Button
  summary: Use Button.
`;
  assert.throws(
    () => parseYamlRecord(yaml, { sourcePath: buttonPath }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.ok(error.issues.length > 0, JSON.stringify(error.issues));
      assert.equal(
        error.issues.every((issue) => issue.keyword === "yaml"),
        true,
        JSON.stringify(error.issues),
      );
      return true;
    },
  );
});

test("parseYamlRecord rejects YAML aliases", () => {
  const yaml = `id: component.yaml-button
schemaVersion: 1
type: component
title: &x Button
summary: *x
`;
  assert.throws(
    () => parseYamlRecord(yaml, { sourcePath: buttonPath }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.ok(
        error.issues.some((issue) => issue.keyword === "yaml" && /alias/i.test(issue.message)),
        JSON.stringify(error.issues),
      );
      return true;
    },
  );
});

test("parseYamlRecord requires a contract", () => {
  const yaml = recordYaml({
    id: "component.yaml-button",
    path: buttonPath,
    sources: [{ kind: "authored", path: buttonPath }],
  });
  assert.throws(
    () => parseYamlRecord(yaml, { sourcePath: buttonPath }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.ok(
        error.issues.some((issue) => issue.path === "/contract" && issue.keyword === "required"),
        JSON.stringify(error.issues),
      );
      return true;
    },
  );
});

test("parseYamlRecord rejects duplicate YAML keys with a path", () => {
  const yaml = `${yamlComponent()}\nid: component.other\n`;
  assert.throws(
    () => parseYamlRecord(yaml, { sourcePath: buttonPath }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.ok(
        error.issues.some(
          (issue) => issue.keyword === "uniqueKeys" && /duplicate YAML key/.test(issue.message),
        ),
        JSON.stringify(error.issues),
      );
      return true;
    },
  );
});

test("parseYamlRecord rejects an authored body", () => {
  const yaml = `${yamlComponent()}\nbody: Do not author a body here.\n`;
  assert.throws(
    () => parseYamlRecord(yaml, { sourcePath: buttonPath }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.ok(
        error.issues.some((issue) => issue.path === "/body"),
        JSON.stringify(error.issues),
      );
      return true;
    },
  );
});

test("parseYamlRecord rejects a non-component YAML spec", () => {
  const yaml = recordYaml({
    id: "pattern.yaml-pattern",
    type: "pattern",
    path: "content/patterns/yaml-pattern.spec.yaml",
    sources: [{ kind: "authored", path: "content/patterns/yaml-pattern.spec.yaml" }],
  });
  assert.throws(
    () => parseYamlRecord(yaml, { sourcePath: "content/patterns/yaml-pattern.spec.yaml" }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.ok(
        error.issues.some((issue) => issue.path === "/type"),
        JSON.stringify(error.issues),
      );
      return true;
    },
  );
});

test("parseYamlRecord rejects duplicate usage and rule IDs", () => {
  const yaml = yamlComponent(
    {},
    {
      behavior: [
        {
          id: "trigger-action",
          level: "must",
          statement: "Disabled prevents activation.",
        },
      ],
    },
  );
  assert.throws(
    () => parseYamlRecord(yaml, { sourcePath: buttonPath }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.ok(
        error.issues.some(
          (issue) => issue.path === "/contract/behavior/0/id" && issue.keyword === "uniqueItems",
        ),
        JSON.stringify(error.issues),
      );
      return true;
    },
  );
});

const hierarchyContent = {
  content: [
    {
      id: "follow-action-hierarchy",
      level: "should",
      statement: "Apply the action hierarchy pattern when several actions appear together.",
      references: [{ id: "pattern.action-hierarchy", fragment: "assign-emphasis" }],
    },
  ],
};

test("YAML components coexist with Markdown records and generate a useful body", async () => {
  const patternPath = "content/patterns/action-hierarchy.md";
  const markdownPath = "content/guidelines/note.md";
  const reader = createMemoryReader({
    [buttonPath]: yamlComponent({}, hierarchyContent),
    [patternPath]: recordMarkdown(
      {
        id: "pattern.action-hierarchy",
        type: "pattern",
        sources: [{ kind: "authored", path: patternPath }],
      },
      "Assign emphasis.",
    ),
    [markdownPath]: recordMarkdown(
      {
        id: "guideline.note",
        type: "guideline",
        sources: [{ kind: "authored", path: markdownPath }],
      },
      "Markdown still authors its body.",
    ),
  });

  const corpus = await buildCorpus(reader, [{ root: "content", visibility: "public" }]);
  assert.equal(
    corpus.problems.filter((item) => item.severity === "error").length,
    0,
    JSON.stringify(corpus.problems, null, 2),
  );

  const button = corpus.records.get("component.yaml-button");
  const note = corpus.records.get("guideline.note");
  assert.equal(button.bodyOrigin, "generated");
  assert.match(button.body, /When to use/);
  assert.match(button.body, /When to avoid/);
  assert.match(button.body, /Trigger an action in the current view/);
  assert.match(button.body, /Use Link instead/);
  assert.match(button.body, /\*\*must:\*\*/);
  assert.match(button.body, /\*\*should:\*\*/);
  assert.match(button.body, /markdown\/pattern\.action-hierarchy\.md#assign-emphasis/);
  assert.doesNotMatch(button.body, /fieldset/);
  assert.equal(note.bodyOrigin, "authored");
  assert.match(note.body, /Markdown still authors its body/);
});

test("plain-language instead values are not unresolved record IDs", async () => {
  const reader = createMemoryReader({
    [buttonPath]: yamlComponent(),
  });
  const corpus = await buildCorpus(reader, [{ root: "content", visibility: "public" }]);
  assert.equal(
    codes(corpus, PROBLEM.CONTRACT_UNRESOLVED_REFERENCE).length,
    0,
    JSON.stringify(corpus.problems, null, 2),
  );
  assert.equal(codes(corpus, PROBLEM.CORPUS_UNRESOLVED_RELATION).length, 0);
});

test("unresolved rule references fail the compile", async () => {
  const reader = createMemoryReader({
    [buttonPath]: yamlComponent({}, hierarchyContent),
  });
  const corpus = await buildCorpus(reader, [{ root: "content", visibility: "public" }]);
  const unresolved = codes(corpus, PROBLEM.CONTRACT_UNRESOLVED_REFERENCE);
  assert.ok(unresolved.length > 0, JSON.stringify(corpus.problems, null, 2));
  assert.match(unresolved[0].message, /pattern\.action-hierarchy/);
});
