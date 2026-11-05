import fs from "fs";
import path from "path";
const dir = "packages/spec/content/components";
let tot = [0, 0];
for (const c of fs.readdirSync(dir)) {
  const y = fs.readFileSync(path.join(dir, c, c + ".spec.yaml"), "utf8");
  const spec = new Set(
    [...y.matchAll(/\b(semantic|primitives)\.[a-zA-Z0-9.-]+/g)].map((m) =>
      m[0]
        .replace(/\.$/, "")
        .replace(/\./g, "-")
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase(),
    ),
  );
  const f = `packages/components/src/${c}.css`;
  if (!fs.existsSync(f)) {
    console.log(c, "no web css");
    continue;
  }
  const css = new Set(
    [...fs.readFileSync(f, "utf8").matchAll(/--ds-((?:semantic|primitives)-[a-z0-9-]+)/g)].map(
      (m) => m[1],
    ),
  );
  const specOnly = [...spec].filter((x) => !css.has(x)),
    cssOnly = [...css].filter((x) => !spec.has(x));
  tot[0] += specOnly.length;
  tot[1] += cssOnly.length;
  console.log(
    c,
    `spec ${spec.size} css ${css.size} specOnly ${specOnly.length} cssOnly ${cssOnly.length}`,
    specOnly.slice(0, 4).join(","),
    "|",
    cssOnly.slice(0, 4).join(","),
  );
}
console.log("total", tot);
