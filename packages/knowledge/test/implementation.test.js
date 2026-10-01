import { describe, expect, it } from "vitest";
import { parseImplementation, renderImplementation } from "../src/implementation.js";

const record = {
  id: "component.toggle",
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
