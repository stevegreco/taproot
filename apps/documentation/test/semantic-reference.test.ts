import assert from "node:assert/strict";
import { test } from "vitest";
import { groupedColorReference, semanticReferenceMarkdown } from "../lib/semantic-reference";

test("background action references expose one token per neutral state", () => {
  const { actions } = groupedColorReference("background");

  assert.deepEqual(
    actions.map((action) => action.family),
    ["Primary", "Secondary", "Tertiary", "Destructive"],
  );

  const secondary = actions.find((action) => action.family === "Secondary")!;
  assert.deepEqual(
    secondary.cells.get("hover")?.tokens.map((token) => token.path),
    ["semantic.color.background.action.secondary.hover"],
  );

  const tertiary = actions.find((action) => action.family === "Tertiary")!;
  assert.equal(tertiary.cells.get("default")?.kind, "transparent");
  assert.deepEqual(
    tertiary.cells.get("pressed")?.tokens.map((token) => token.path),
    ["semantic.color.background.action.tertiary.pressed"],
  );
});

test("background reference Markdown uses readable per-family state lists", () => {
  const markdown = semanticReferenceMarkdown("background");

  assert.doesNotMatch(markdown, /state-layer|\| Action \|/i);
  assert.match(
    markdown,
    /##### Secondary[\s\S]*- Hover: `--ds-semantic-color-background-action-secondary-hover`/,
  );
  assert.match(markdown, /##### Tertiary[\s\S]*- Default: Transparent/);
});
