/** Compiles `types/element-types.probe.ts` against the package's published element types. */
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { expect, test } from "vitest";

const probe = fileURLToPath(new URL("./types/element-types.probe.ts", import.meta.url));

// Type-checking can take several seconds in CI, past the default 5-second limit.
test("the published element types accept real attributes and reject wrong ones", () => {
  const program = ts.createProgram({
    rootNames: [probe],
    options: {
      lib: ["lib.esnext.d.ts", "lib.dom.d.ts"],
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      target: ts.ScriptTarget.ESNext,
      types: [],
    },
  });
  const problems = ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "));

  expect(problems).toEqual([]);
}, 20_000);
