/**
 * The docs examples type-check against the element types the components
 * package generates from the bindings (`src/<name>.d.ts`, `ElementAttributes`).
 *
 * A probe file proves the JSX types are real: each `@ts-expect-error` line must
 * fail to compile, or TypeScript reports the directive as unused.
 */
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { test } from "vitest";

const docsRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const examplesDir = join(docsRoot, "examples");
const probePath = join(examplesDir, "__element-types-probe__.tsx");

const PROBE = `
export const probes = [
  <ds-button variant="secondary" size="small" type="submit" full-width disabled />,
  <ds-checkbox label="Terms" checked indeterminate={false} name="terms" value="yes" />,
  // @ts-expect-error "loud" is not a Button variant.
  <ds-button variant="loud" />,
  // @ts-expect-error Button's action maps to type, not action.
  <ds-button action="submit" />,
  // @ts-expect-error checked is a boolean.
  <ds-checkbox checked="yes" />,
];

export function narrow(element: HTMLElementTagNameMap["ds-link"]) {
  element.variant = "standalone";
  // @ts-expect-error "block" is not a Link variant.
  element.variant = "block";
}
`;

// Type-checking takes 3 to 4 seconds in CI, too close to the default 5-second limit.
test("examples type-check against the generated element types", () => {
  const configPath = ts.findConfigFile(docsRoot, ts.sys.fileExists, "tsconfig.json");
  assert.ok(configPath, "the docs app has a tsconfig.json");
  const config = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      },
    },
  );
  assert.ok(config);

  const examples = readdirSync(examplesDir)
    .filter((file) => file.endsWith(".tsx") || file.endsWith(".d.ts"))
    .map((file) => join(examplesDir, file));

  const host = ts.createCompilerHost(config.options);
  const { fileExists, getSourceFile, readFile } = host;
  host.fileExists = (file) => file === probePath || fileExists(file);
  host.readFile = (file) => (file === probePath ? PROBE : readFile(file));
  host.getSourceFile = (file, language, ...rest) =>
    file === probePath
      ? ts.createSourceFile(file, PROBE, language, true, ts.ScriptKind.TSX)
      : getSourceFile(file, language, ...rest);

  const program = ts.createProgram({
    rootNames: [...examples, probePath],
    options: { ...config.options, noEmit: true },
    host,
  });

  const problems = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file?.fileName.startsWith(examplesDir))
    .map((diagnostic) => {
      const { line } = diagnostic.file!.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
      const file = diagnostic.file!.fileName.slice(docsRoot.length + 1);
      return `${file}:${line + 1} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`;
    });
  assert.deepEqual(problems, []);
}, 20_000);
