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
  "web-component",
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

  it("says a row with no Implements entry is specific to the implementation", () => {
    expect(out).toContain(
      "| `toggle` | event | event `change` |  | The mode changed. |\n\nA row with no Implements entry is specific to this implementation, not part of the spec.",
    );
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
    "web-component",
  );
  const check = (edit) => () =>
    checkImplementation({ ...listImplementation, ...edit(listImplementation) }, listRecord);

  it("renders each item's element and rows from the item's parameters and events", () => {
    const out = renderImplementation(listRecord, listImplementation, "web");
    expect(out).toContain("### Entry element: `<acme-list-entry>`");
    expect(out).toContain(
      "| `label` | attribute | entry parameter `label` | string | Visible text of the entry. |",
    );
    expect(out).toContain("| `pick` | event | entry event `pick` |  | The entry was picked. |");
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
      parseImplementation(
        source("items:\n  entry:\n    api: []\n"),
        "implementation/list.md",
        "web-component",
      ),
    ).toThrow("items.entry tagName must be a non-empty string.");
    const empty = parseImplementation(
      source("items:\n  entry:\n    tagName: acme-list-entry\n    api: []\n"),
      "implementation/list.md",
      "web-component",
    );
    expect(() => checkImplementation(empty, listRecord)).toThrow(
      'does not cover component.list item "entry" parameter "label", event "pick"',
    );
  });

  it("accepts a native element for an item, but not an invalid name", () => {
    const native = parseImplementation(
      source("items:\n  entry:\n    tagName: option\n    api: []\n"),
      "implementation/list.md",
      "web-component",
    );
    expect(native.items.entry.tagName).toBe("option");
    expect(() =>
      parseImplementation(
        source("items:\n  entry:\n    tagName: Option\n    api: []\n"),
        "implementation/list.md",
        "web-component",
      ),
    ).toThrow('items.entry tagName "Option" must be an element name');
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
      "web-component",
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

describe("parts", () => {
  const cardRecord = {
    id: "component.card",
    type: "component",
    parameters: { href: { kind: "string", description: "Where the card leads." } },
    parts: {
      title: {
        parameters: { label: { kind: "string", description: "Text of the title." } },
      },
    },
  };
  const source = (parts) => `---
component: component.card
package: "@acme/ui"
tagName: acme-card
defineExport: defineCard
api:
  - { name: href, kind: attribute, parameter: href }
${parts}---
`;
  const onComponent = parseImplementation(
    source(`parts:
  title:
    api:
      - { name: label, kind: attribute, parameter: label }
`),
    "implementation/card.md",
    "web-component",
  );

  it("sets a part's rows on the component when the part has no element", () => {
    expect(onComponent.parts.title.tagName).toBeUndefined();
    expect(() => checkImplementation(onComponent, cardRecord)).not.toThrow();
    const out = renderImplementation(cardRecord, onComponent, "web");
    expect(out).toContain("### Title part, on `<acme-card>`");
    expect(out).toContain(
      "| `label` | attribute | title parameter `label` | string | Text of the title. |",
    );
  });

  it("names the element when the part is its own", () => {
    const child = parseImplementation(
      source(`parts:
  title:
    tagName: acme-card-title
    api:
      - { name: label, kind: attribute, parameter: label }
`),
      "implementation/card.md",
      "web-component",
    );
    expect(() => checkImplementation(child, cardRecord)).not.toThrow();
    expect(renderImplementation(cardRecord, child, "web")).toContain(
      "### Title element: `<acme-card-title>`",
    );
  });

  it("imports a React part's own component", () => {
    const react = parseImplementation(
      `---
component: component.card
package: "@acme/react"
export: Card
api:
  - { name: href, kind: prop, parameter: href }
parts:
  title:
    export: CardTitle
    api:
      - { name: label, kind: prop, parameter: label }
---
`,
      "implementation/card.md",
      "react",
    );
    expect(() => checkImplementation(react, cardRecord)).not.toThrow();
    const out = renderImplementation(cardRecord, react, "react");
    expect(out).toContain('import { Card, CardTitle } from "@acme/react";');
    expect(out).toContain("### Title component: `CardTitle`");
  });

  it("rejects a missing part, an unknown part, or a part table that skips a parameter", () => {
    const check = (edit) => () =>
      checkImplementation({ ...onComponent, ...edit(onComponent) }, cardRecord);
    expect(check(() => ({ parts: {} }))).toThrow(
      'parts does not cover component.card part "title". Add its api rows.',
    );
    expect(check((impl) => ({ parts: { ...impl.parts, media: impl.parts.title } }))).toThrow(
      "parts.media implements a part component.card does not have",
    );
    expect(check(() => ({ parts: { title: { api: [] } } }))).toThrow(
      'does not cover component.card part "title" parameter "label"',
    );
  });
});

describe("technologies", () => {
  const listRecord = {
    id: "component.list",
    type: "component",
    parameters: { mode: { kind: "enum", values: { on: "On.", off: "Off." }, description: "M." } },
    events: { change: "The mode changed." },
    items: { entry: { parameters: { label: { kind: "string", description: "Entry text." } } } },
  };
  const react = `---
component: component.list
package: "@acme/react"
export: List
usage: <List mode="on" />
api:
  - { name: mode, kind: prop, parameter: mode }
  - { name: onChange, kind: callback, event: change }
items:
  entry:
    export: ListEntry
    api:
      - { name: label, kind: prop, parameter: label }
---
`;
  const parsed = parseImplementation(react, "implementation/list.md", "react");

  it("reads a React file with its export names and prop and callback rows", () => {
    expect(parsed.technology).toBe("react");
    expect(parsed.export).toBe("List");
    expect(parsed.items.entry.export).toBe("ListEntry");
    expect(() => checkImplementation(parsed, listRecord)).not.toThrow();
  });

  it("renders the component, its import, and tsx usage", () => {
    const out = renderImplementation(listRecord, parsed, "react");
    expect(out).toContain("- Package: `@acme/react`\n- Component: `List`");
    expect(out).toContain('import { List, ListEntry } from "@acme/react";');
    expect(out).toContain('```tsx\n<List mode="on" />\n```');
    expect(out).toContain("| `onChange` | callback | event `change` |  | The mode changed. |");
    expect(out).toContain("### Entry component: `ListEntry`");
  });

  it("checks a file against its technology's fields and row kinds", () => {
    expect(() =>
      parseImplementation(
        react.replace("export: List\n", "tagName: acme-list\n"),
        "implementation/list.md",
        "react",
      ),
    ).toThrow('unknown field "tagName"');
    expect(() =>
      parseImplementation(react.replace("kind: callback", "kind: event"), "x.md", "react"),
    ).toThrow("kind must be one of prop, callback for react");
    expect(() =>
      parseImplementation(react.replace("export: List", "export: list"), "x.md", "react"),
    ).toThrow('export "list" must be a component name');
    expect(() => parseImplementation(react, "implementation/list.md", "web-component")).toThrow(
      'unknown field "export"',
    );
    expect(() => parseImplementation(react, "x.md", "vue")).toThrow('unknown technology "vue"');
  });

  it("maps an item to the entries of an array prop, with a field row per key", () => {
    const array = react.replace(
      "    export: ListEntry\n    api:\n      - { name: label, kind: prop, parameter: label }",
      "    prop: entries\n    api:\n      - { name: label, kind: field, parameter: label }",
    );
    const parsed = parseImplementation(array, "implementation/list.md", "react");
    expect(parsed.items.entry).toEqual({
      prop: "entries",
      api: [{ name: "label", kind: "field", parameter: "label" }],
    });
    expect(() => checkImplementation(parsed, listRecord)).not.toThrow();
    const out = renderImplementation(listRecord, parsed, "react");
    expect(out).toContain('import { List } from "@acme/react";');
    expect(out).toContain("### Entry: an entry of `entries`");
    expect(out).toContain("| `label` | field | entry parameter `label` | string | Entry text. |");
    expect(() =>
      parseImplementation(array.replace("kind: field", "kind: prop"), "x.md", "react"),
    ).toThrow("kind must be one of field for react");
    expect(() =>
      parseImplementation(
        array.replace("    prop: entries\n", "    prop: entries\n    export: ListEntry\n"),
        "x.md",
        "react",
      ),
    ).toThrow("items.entry takes `export` or `prop`, not both.");
    expect(() =>
      parseImplementation(
        array
          .replace("kind: field", "kind: prop")
          .replace("  - { name: mode, kind: prop", "  - { name: mode, kind: field"),
        "x.md",
        "react",
      ),
    ).toThrow("kind must be one of prop, callback for react");
  });

  it("names the file in every front matter error", () => {
    const parse = (frontMatter) =>
      parseImplementation(`---\n${frontMatter}\n---\n`, "implementation/x.md", "web-component");
    const valid =
      "component: component.x\npackage: pkg\ntagName: ds-x\ndefineExport: defineX\napi:\n  - { name: a, kind: attribute, parameter: a }";

    expect(() => parse(valid)).not.toThrow();
    expect(() =>
      parseImplementation("no front matter", "implementation/x.md", "web-component"),
    ).toThrow(/x\.md: must start with YAML/);
    expect(() => parse(valid.replace("component.x", "button"))).toThrow(
      /x\.md: component "button"/,
    );
    expect(() => parse(valid.replace("ds-x", "dsx"))).toThrow(/tagName "dsx"/);
    expect(() => parse(`${valid}\nextra: 1`)).toThrow(/unknown field "extra"/);
    expect(() => parse(valid.replace("parameter: a", "type: string"))).toThrow(
      /needs "parameter".*or both "type" and "description"/,
    );
    expect(() => parse(`${valid}\n  - { name: a, kind: attribute, parameter: b }`)).toThrow(
      /lists the attribute "a" twice/,
    );
  });
});
