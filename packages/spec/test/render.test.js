import { beforeAll, describe, expect, it } from "vitest";
import { loadSpec, renderRecord } from "../src/index.js";
import { fixture } from "./helpers.js";

let valid;

beforeAll(async () => {
  valid = await loadSpec({
    contentDir: fixture("valid"),
    resolveToken: (ref) => (ref.endsWith(".radius") ? { light: "4px", dark: "2px" } : undefined),
  });
});

describe("render", () => {
  it("renders a component as prose and tables", () => {
    const lines = valid.render("component.thing").split("\n");
    expect(lines).toContain("# Thing");
    expect(lines).toContain("Use Thing for testing.");
    expect(lines).toContain("## When to use");
    expect(lines).toContain("- **MUST** stay-visible: Stay visible.");
    expect(lines).toContain("- **SHOULD** keep-it-short: Keep the text short.");
    expect(lines).toContain("| Part | Role | Description |");
    expect(lines).toContain("| tone | enum | `calm`, `loud` | `calm` |  |");
    expect(lines).toContain("- `calm`: Quiet. Example: Hush");
    expect(lines).toContain("## Rules");
    expect(lines.indexOf("### Content")).toBeLessThan(lines.indexOf("### Behavior"));
  });

  it("references alternatives by id and leaves prose as text", () => {
    const text = valid.render("component.other");
    expect(text).toContain(
      "Do a thing Other cannot. Use [Thing](component.thing) instead. Thing can.",
    );
    expect(text).toContain("Do something not built yet. Use a future component instead.");
  });

  it("adds a column per resolved token value set", () => {
    const lines = valid.render("component.thing").split("\n");
    expect(lines).toContain("| Part | Condition | Property | Token | dark | light |");
    expect(lines).toContain("| control | `base` | radius | `component.thing.radius` | 2px | 4px |");
  });

  it("groups links by kind", () => {
    const lines = valid.render("component.thing").split("\n");
    expect(lines).toContain("## Links");
    expect(lines).toContain("### composes");
    expect(lines).toContain("- [Other](component.other)");
    expect(lines).toContain("- [Guide](pattern.guide#first-step)");
  });

  it("renders a Markdown record as title, summary, body, and links", () => {
    const text = valid.render("pattern.guide");
    expect(text.startsWith("# Guide\n\nGuidance for tests.\n\n## First step")).toBe(true);
    expect(text).toContain("### followed-by");
  });

  it("renders an example's annotations with their addresses and references", () => {
    const text = valid.render("example.guide.demo");
    expect(text).toContain("## Annotations");
    expect(text).toContain(
      "- **The box** (`example.guide.demo#box`): It is a box. See [Guide](pattern.guide#second-step).",
    );
  });

  it("names each parameter value's guidance section", () => {
    expect(valid.render("component.thing")).toContain(
      "- `loud`: Noisy. Guidance: [Guide](pattern.guide#second-step)",
    );
  });

  it("renders only the requested section", () => {
    const heading = valid.render("pattern.guide#detail");
    expect(heading).toBe("### Detail\n\nMore.\n");
    expect(valid.render("component.thing#stay-visible")).toBe(
      "- **MUST** stay-visible: Stay visible.\n",
    );
    expect(valid.render("component.thing#usage")).toContain("## When to use");
    expect(valid.render("component.thing#usage")).not.toContain("## Rules");
    expect(valid.render("example.guide.demo#box")).toContain("## The box\n\nIt is a box.");
  });

  it("renders a parameter value with its paired example and guidance", () => {
    expect(valid.render("component.thing#parameters.tone.calm")).toBe(
      "## calm\n\nQuiet.\n\nExample: Hush\n",
    );
    expect(valid.render("component.thing#parameters.tone.loud")).toBe(
      "## loud\n\nNoisy.\n\nGuidance: [Guide](pattern.guide#second-step)\n",
    );
  });

  it("is deterministic across renders and loads", async () => {
    const again = await loadSpec({ contentDir: fixture("valid") });
    expect(valid.render("component.other")).toBe(valid.render("component.other"));
    expect(again.render("pattern.guide")).toBe(valid.render("pattern.guide"));
    expect(renderRecord(valid, "component.thing")).toBe(valid.render("component.thing"));
  });

  it("throws for an unknown record or section", () => {
    expect(() => valid.render("component.nope")).toThrow("No record has the id component.nope");
    expect(() => valid.render("pattern.guide#nope")).toThrow("has no section nope");
  });
});
