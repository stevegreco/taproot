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
