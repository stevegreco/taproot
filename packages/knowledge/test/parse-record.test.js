import assert from "node:assert/strict";
import { test } from "node:test";
import { KnowledgeRecordError, parseRecord } from "../src/index.js";

const validComponent = `---
id: component.test-button
schemaVersion: 1
type: component
title: Test button
summary: Triggers a test action.
status: draft
visibility: public
jobs:
  - implement
tags:
  - button
relations: {}
sources:
  - kind: authored
    path: packages/knowledge/content/components/test-button.md
---

Use this component to trigger a test action.
`;

test("parseRecord returns validated metadata and body", () => {
  const record = parseRecord(validComponent, { sourcePath: "test-button.md" });

  assert.equal(record.id, "component.test-button");
  assert.equal(record.type, "component");
  assert.equal(record.body, "Use this component to trigger a test action.");
});

test("parseRecord rejects an incompatible schemaVersion with a useful field path", () => {
  const markdown = validComponent.replace("schemaVersion: 1", "schemaVersion: 2");

  assert.throws(
    () => parseRecord(markdown, { sourcePath: "records/test-button.md" }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.equal(error.sourcePath, "records/test-button.md");
      assert.match(error.message, /records\/test-button\.md/);
      assert.match(error.message, /\/schemaVersion/);
      assert.ok(
        error.issues.some((issue) => issue.path === "/schemaVersion"),
        "expected an issue pointing at /schemaVersion",
      );
      return true;
    },
  );
});

function assertIssuePath(markdown, sourcePath, expectedPath) {
  assert.throws(
    () => parseRecord(markdown, { sourcePath }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.equal(error.sourcePath, sourcePath);
      assert.ok(
        error.issues.some((issue) => issue.path === expectedPath),
        `expected an issue pointing at ${expectedPath}, got ${JSON.stringify(error.issues)}`,
      );
      return true;
    },
  );
}

test("parseRecord rejects . and .. segments in repository paths", () => {
  const traversal = validComponent.replace(
    "    path: packages/knowledge/content/components/test-button.md",
    "    path: packages/knowledge/content/../secret.md",
  );
  assertIssuePath(traversal, "test-button.md", "/sources/0/path");

  const dotSegment = validComponent.replace(
    "    path: packages/knowledge/content/components/test-button.md",
    "    path: packages/knowledge/content/./test-button.md",
  );
  assertIssuePath(dotSegment, "test-button.md", "/sources/0/path");
});

test("parseRecord rejects unknown fields at every object level", () => {
  const rootUnknown = validComponent.replace("\n---\n\n", "\nspurious: true\n---\n\n");
  assertIssuePath(rootUnknown, "test-button.md", "/spurious");

  const nestedUnknown = validComponent.replace(
    "relations: {}",
    `relations:
  unexpected:
    - component.button`,
  );
  assertIssuePath(nestedUnknown, "test-button.md", "/relations/unexpected");

  const sourceUnknown = validComponent.replace(
    "    path: packages/knowledge/content/components/test-button.md",
    `    path: packages/knowledge/content/components/test-button.md
    extra: true`,
  );
  assertIssuePath(sourceUnknown, "test-button.md", "/sources/0/extra");
});

test("parseRecord rejects generated provenance in authored Markdown", () => {
  const markdown = validComponent.replace(
    `sources:
  - kind: authored
    path: packages/knowledge/content/components/test-button.md`,
    `sources:
  - kind: authored
    path: packages/knowledge/content/components/test-button.md
  - kind: generated
    path: dist/public/records.json`,
  );

  assertIssuePath(markdown, "test-button.md", "/sources/1/kind");
});

test("parseRecord accepts an authored source that is not first", () => {
  const markdown = validComponent.replace(
    `sources:
  - kind: authored
    path: packages/knowledge/content/components/test-button.md`,
    `sources:
  - kind: token-source
    path: packages/tokens/src/tokens/components/button.tokens.json
  - kind: authored
    path: packages/knowledge/content/components/test-button.md`,
  );

  const record = parseRecord(markdown, { sourcePath: "test-button.md" });
  assert.equal(record.sources[0].kind, "token-source");
  assert.equal(record.sources[1].kind, "authored");
});

test("parseRecord fills compiler-known authored fields", () => {
  const markdown = `---
id: component.test-button
type: component
title: Test button
summary: Triggers a test action.
status: draft
jobs:
  - implement
tags:
  - button
---

Use this component to trigger a test action.
`;
  const record = parseRecord(markdown, {
    sourcePath: "packages/knowledge/content/components/test-button.md",
  });

  assert.equal(record.schemaVersion, 1);
  assert.deepEqual(record.relations, {});
  assert.deepEqual(record.sources, [
    { kind: "authored", path: "packages/knowledge/content/components/test-button.md" },
  ]);
  assert.equal(Object.hasOwn(record, "visibility"), false);
});

test("parseRecord still requires jobs", () => {
  const markdown = validComponent.replace("\njobs:\n  - implement\n", "\n");
  assertIssuePath(markdown, "test-button.md", "/jobs");
});

test("parseRecord injects an authored source when only an adr source is declared", () => {
  const markdown = validComponent.replace(
    `sources:
  - kind: authored
    path: packages/knowledge/content/components/test-button.md`,
    `sources:
  - kind: adr
    path: packages/tokens/docs/adr/0003-token-tier-consumption.md`,
  );

  const record = parseRecord(markdown, { sourcePath: "test-button.md" });
  assert.equal(record.sources[0].kind, "adr");
  assert.deepEqual(record.sources[1], { kind: "authored", path: "test-button.md" });
});

test("parseRecord rejects a frontmatter body key", () => {
  const markdown = validComponent.replace("\n---\n\n", "\nbody: stolen from YAML\n---\n\n");
  assertIssuePath(markdown, "test-button.md", "/body");
});

test("parseRecord rejects missing frontmatter with a record-level path", () => {
  assert.throws(
    () => parseRecord("Just markdown.\n", { sourcePath: "notes.md" }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.equal(error.sourcePath, "notes.md");
      assert.equal(error.issues.length, 1);
      assert.equal(error.issues[0].path, "");
      return true;
    },
  );
});

test("parseRecord rejects malformed YAML frontmatter with a record-level path", () => {
  assert.throws(
    () => parseRecord("---\nid: [unterminated\n---\n\nBody.\n", { sourcePath: "notes.md" }),
    (error) => {
      assert.equal(error instanceof KnowledgeRecordError, true);
      assert.equal(error.sourcePath, "notes.md");
      assert.equal(error.issues.length, 1);
      assert.equal(error.issues[0].path, "");
      return true;
    },
  );
});

const validContract = `
  specVersion: 2
  description: Triggers an action.
  usage:
    do:
      - situation: Trigger an action in the current view.
    avoid:
      - situation: Navigate away.
        instead: Link
        why: Links provide native navigation semantics.
  anatomy:
    - name: control
      role: interactive-surface
      description: Interactive control.
  parameters:
    disabled:
      kind: boolean
      default: false
  events:
    activate:
      description: Requests the action.
  states:
    - default
  behavior:
    - Disabled prevents activation.
  accessibility:
    semantics: Button.
    name: Required from visible content.
  rationale:
    - decision: Keep the contract host-neutral.
      rationale: Host spellings live on the binding.
`;

const validHost = `
  specVersion: 1
  platform: web-component
  package: "@stevegreco/design-system-components"
  export: DsButton
  defaultTagName: ds-button
  registration:
    export: defineButton
    supportsAliases: true
  anatomy:
    control:
      element: button
      part: button
  parameters:
    disabled:
      attribute: disabled
      property: disabled
  events:
    activate:
      event: click
`;

const validSpec = `---
id: spec.test-button
schemaVersion: 1
type: spec
title: Test button contract
summary: Trigger a test action.
status: draft
visibility: public
jobs:
  - design
  - implement
tags:
  - button
relations: {}
sources:
  - kind: authored
    path: packages/knowledge/content/specs/test-button.md
contract:${validContract}
---

Portable contract for the test button.
`;

const validBinding = `---
id: binding.test-button.web-component
schemaVersion: 1
type: binding
title: Test button web component
summary: Maps the test button onto ds-button.
status: draft
visibility: public
jobs:
  - implement
tags:
  - button
relations:
  implements:
    - component.test-button
sources:
  - kind: authored
    path: packages/knowledge/content/bindings/test-button.web-component.md
host:${validHost}
---

Register with defineButton().
`;

test("parseRecord accepts a spec with a portable contract", () => {
  const record = parseRecord(validSpec, {
    sourcePath: "packages/knowledge/content/specs/test-button.md",
  });
  assert.equal(record.type, "spec");
  assert.equal(record.contract.specVersion, 2);
  assert.equal(record.contract.parameters.disabled.kind, "boolean");
  assert.equal(Object.hasOwn(record.contract, "tagName"), false);
});

test("parseRecord rejects a spec without contract", () => {
  const markdown = validSpec.replace(/\ncontract:[\s\S]*?\n---\n/, "\n---\n");
  assertIssuePath(markdown, "packages/knowledge/content/specs/test-button.md", "/contract");
});

test("parseRecord rejects tagName on an authored spec contract", () => {
  const markdown = validSpec.replace(
    "  specVersion: 2\n",
    "  specVersion: 2\n  tagName: ds-button\n",
  );
  assertIssuePath(
    markdown,
    "packages/knowledge/content/specs/test-button.md",
    "/contract/tagName",
  );
});

test("parseRecord accepts a binding with a host mapping", () => {
  const record = parseRecord(validBinding, {
    sourcePath: "packages/knowledge/content/bindings/test-button.web-component.md",
  });
  assert.equal(record.type, "binding");
  assert.equal(record.host.defaultTagName, "ds-button");
  assert.equal(record.host.specVersion, 1);
});

test("parseRecord rejects a binding without host", () => {
  const markdown = validBinding.replace(/\nhost:[\s\S]*?\n---\n/, "\n---\n");
  assertIssuePath(
    markdown,
    "packages/knowledge/content/bindings/test-button.web-component.md",
    "/host",
  );
});

test("parseRecord rejects contract on an authored component", () => {
  const markdown = validComponent.replace(
    "\n---\n\n",
    `\ncontract:${validContract}---\n\n`,
  );
  assertIssuePath(markdown, "test-button.md", "/contract");
});

test("parseRecord rejects host on an authored component", () => {
  const markdown = validComponent.replace("\n---\n\n", `\nhost:${validHost}---\n\n`);
  assertIssuePath(markdown, "test-button.md", "/host");
});
