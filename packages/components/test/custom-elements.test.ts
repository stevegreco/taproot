/** Checks dist/custom-elements.json, which `pnpm build` writes with build-manifest.js. */
import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

type Attribute = { name: string; type?: { text: string } };
type Declaration = {
  name: string;
  tagName: string;
  attributes?: Attribute[];
  events?: { name: string }[];
};
type Module = {
  path: string;
  declarations: Declaration[];
  exports: { kind: string; name: string }[];
};

const manifest: { schemaVersion: string; modules: Module[] } = JSON.parse(
  read("dist/custom-elements.json"),
);
const declarations = manifest.modules.flatMap((module) => module.declarations);
const byTag = new Map(declarations.map((declaration) => [declaration.tagName, declaration]));
const components = readdirSync(new URL("../src", import.meta.url))
  .filter((file) => file.endsWith(".js") && file !== "index.js")
  .map((file) => file.slice(0, -".js".length));

test("the package points tools at the manifest", () => {
  const pkg = JSON.parse(read("package.json"));
  expect(pkg.customElements).toBe("./dist/custom-elements.json");
  expect(pkg.files).toContain("dist");
  expect(manifest.schemaVersion).toBe("2.1.0");
});

test("every element the package registers is declared, with its class and define export", () => {
  for (const name of components) {
    const dts = read(`src/${name}.d.ts`);
    const tagMap = dts.match(/interface HTMLElementTagNameMap \{([^}]*)\}/)?.[1] ?? "";
    const module = manifest.modules.find((m) => m.path === `src/${name}.js`);
    expect(module, `src/${name}.js`).toBeDefined();
    for (const [, tagName, className] of tagMap.matchAll(/"([a-z][\w-]*)": (\w+);/g)) {
      expect(byTag.get(tagName)?.name, `<${tagName}>`).toBe(className);
      expect(module!.exports).toContainEqual(
        expect.objectContaining({ kind: "custom-element-definition", name: tagName }),
      );
    }
    expect(module!.exports.some((e) => e.kind === "js" && /^define[A-Z]/.test(e.name))).toBe(true);
  }
});

test("every observed attribute is declared", () => {
  for (const name of components) {
    const js = read(`src/${name}.js`);
    // Each class runs to the next top-level declaration.
    const classes = js.split(/^(?=(?:export )?class )/m).slice(1);
    for (const source of classes) {
      const className = source.match(/class (\w+)/)![1];
      const list = source.match(/static observedAttributes = \[([^\]]*)\]/)?.[1] ?? "";
      const declaration = declarations.find((d) => d.name === className);
      if (!declaration) continue;
      const declared = new Set((declaration.attributes ?? []).map((a) => a.name));
      for (const [, attribute] of list.matchAll(/"([\w-]+)"/g)) {
        // Native attributes the element mirrors, such as `hidden`, are not part of its API table.
        if (["hidden", "aria-label"].includes(attribute) && !declared.has(attribute)) continue;
        expect(declared.has(attribute), `<${declaration.tagName} ${attribute}>`).toBe(true);
      }
    }
  }
});

test("enum attributes list the web values, not the spec's", () => {
  const type = byTag.get("ds-button")!.attributes!.find((a) => a.name === "type");
  expect(type?.type?.text).toBe('"button" | "submit" | "reset"');
});
