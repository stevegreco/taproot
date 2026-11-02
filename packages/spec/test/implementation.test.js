import { describe, expect, it } from "vitest";
import {
  checkImplementation,
  parseImplementation,
  renderImplementation,
} from "../src/implementation.js";

const record = {
  id: "component.toggle",
  type: "component",
  parameters: {
    mode: { kind: "enum", values: { on: "On.", off: "Off." }, description: "The mode." },
    label: { kind: "string", description: "Visible label." },
  },
  events: { change: "The mode changed." },
};

const implementation = parseImplementation(
  `---
component: component.toggle
package: "@acme/ui"
tagName: acme-toggle
defineExport: defineToggle
usage: <acme-toggle state="on"></acme-toggle>
api:
  - { name: state, kind: attribute, parameter: mode, values: { on: "true", off: off } }
  - { name: label, kind: attribute, parameter: label, description: Overrides the record. }
  - { name: value, kind: property, type: string, description: The current state. }
  - { name: toggle, kind: event, event: change }
---

## Labels

Keep labels short.
`,
  "implementation/toggle.md",
);

describe("renderImplementation", () => {
  const out = renderImplementation(record, implementation, "web");

  it("names the package, element, and import", () => {
    expect(out).toMatch(/^## Web implementation\n/);
    expect(out).toContain("- Package: `@acme/ui`\n- Element: `<acme-toggle>`");
    expect(out).toContain('import { defineToggle } from "@acme/ui/toggle";\n\ndefineToggle();');
    expect(out).toContain('```html\n<acme-toggle state="on"></acme-toggle>\n```');
  });

  it("maps each row to the parameter or event it implements", () => {
    expect(out).toContain(
      "| `state` | attribute | parameter `mode` | `on` → `true`, `off` | The mode. |",
    );
    expect(out).toContain(
      "| `label` | attribute | parameter `label` | string | Overrides the record. |",
    );
    expect(out).toContain("| `value` | property |  | `string` | The current state. |");
    expect(out).toContain("| `toggle` | event | event `change` |  | The mode changed. |");
  });

  it("puts the guidance one heading level down", () => {
    expect(out).toContain("### Labels\n\nKeep labels short.");
  });
});

describe("checkImplementation", () => {
  const check =
    (edit, file = "implementation/toggle.md") =>
    () =>
      checkImplementation({ ...implementation, ...edit(implementation), file }, record);
  const rows = (change) => (impl) => ({ api: impl.api.map(change) });

  it("accepts an implementation that matches its record", () => {
    expect(check(() => ({}))).not.toThrow();
  });

  it("rejects a parameter, value, or event the record does not have", () => {
    expect(
      check(rows((row) => (row.parameter === "mode" ? { ...row, parameter: "mood" } : row))),
    ).toThrow(
      'implementation/toggle.md: api row "state" implements the parameter "mood", but component.toggle has no such parameter.',
    );
    expect(check(rows((row) => (row.values ? { ...row, values: { of: "false" } } : row)))).toThrow(
      'renames the value "of"',
    );
    expect(check(rows((row) => (row.event ? { ...row, event: "changed" } : row)))).toThrow(
      'implements the event "changed"',
    );
  });

  it("rejects a table that skips a parameter or event", () => {
    expect(check((impl) => ({ api: impl.api.filter((row) => !row.event) }))).toThrow(
      'does not cover component.toggle event "change"',
    );
  });

  it("rejects a file named after another component, or a record that is not a component", () => {
    expect(check(() => ({}), "implementation/switch.md")).toThrow("Name the file toggle.md.");
    expect(() => checkImplementation(implementation, { ...record, type: "pattern" })).toThrow(
      'component "component.toggle" is not a component record',
    );
  });
});

describe("items", () => {
  const listRecord = {
    id: "component.list",
    type: "component",
    items: {
      entry: {
        parameters: { label: { kind: "string", description: "Visible text of the entry." } },
        events: { pick: "The entry was picked." },
      },
    },
  };
  const source = (items) => `---
component: component.list
package: "@acme/ui"
tagName: acme-list
defineExport: defineList
api:
  - { name: label, kind: attribute, type: string, description: Names the list. }
${items}---
`;
  const listImplementation = parseImplementation(
    source(`items:
  entry:
    tagName: acme-list-entry
    api:
      - { name: label, kind: attribute, parameter: label }
      - { name: pick, kind: event, event: pick }
`),
    "implementation/list.md",
  );
  const check = (edit) => () =>
    checkImplementation({ ...listImplementation, ...edit(listImplementation) }, listRecord);

  it("renders each item's element and rows from the item's parameters and events", () => {
    const out = renderImplementation(listRecord, listImplementation, "web");
    expect(out).toContain("### Entry element: `<acme-list-entry>`");
    expect(out).toContain(
      "| `label` | attribute | parameter `label` | string | Visible text of the entry. |",
    );
    expect(out).toContain("| `pick` | event | event `pick` |  | The entry was picked. |");
  });

  it("accepts items that match the record", () => {
    expect(check(() => ({}))).not.toThrow();
  });

  it("rejects a missing item, an unknown item, or an item table that skips a parameter", () => {
    expect(check(() => ({ items: {} }))).toThrow(
      'items does not cover component.list item "entry"',
    );
    expect(check((impl) => ({ items: { ...impl.items, extra: impl.items.entry } }))).toThrow(
      "items.extra implements an item component.list does not have",
    );
    expect(
      check((impl) => ({
        items: { entry: { ...impl.items.entry, api: impl.items.entry.api.slice(1) } },
      })),
    ).toThrow('does not cover component.list item "entry" parameter "label"');
  });

  it("needs a tag name and a row for each item parameter and event", () => {
    expect(() =>
      parseImplementation(source("items:\n  entry:\n    api: []\n"), "implementation/list.md"),
    ).toThrow("items.entry tagName must be a non-empty string.");
    const empty = parseImplementation(
      source("items:\n  entry:\n    tagName: acme-list-entry\n    api: []\n"),
      "implementation/list.md",
    );
    expect(() => checkImplementation(empty, listRecord)).toThrow(
      'does not cover component.list item "entry" parameter "label", event "pick"',
    );
  });

  it("accepts an empty parent table when every option belongs to an item", () => {
    const itemsOnly = parseImplementation(
      `---
component: component.list
package: "@acme/ui"
tagName: acme-list
defineExport: defineList
api: []
items:
  entry:
    tagName: acme-list-entry
    api:
      - { name: label, kind: attribute, parameter: label }
---
`,
      "implementation/list.md",
    );
    const record = {
      id: "component.list",
      type: "component",
      items: { entry: { parameters: listRecord.items.entry.parameters } },
    };
    expect(() => checkImplementation(itemsOnly, record)).not.toThrow();
    const out = renderImplementation(record, itemsOnly, "web");
    expect(out).not.toContain("### API");
    expect(out).toContain("### Entry element: `<acme-list-entry>`");
    // A parent table can be empty only when the record has nothing for it to cover.
    expect(() =>
      checkImplementation(itemsOnly, { ...record, events: { pick: "Picked." } }),
    ).toThrow('does not cover component.list event "pick"');
  });
});
