import fs from "fs";
const d = "packages/components/implementation";
let names = [];
for (const f of fs.readdirSync(d)) {
  const c = f.replace(".md", "");
  const t = fs.readFileSync(`${d}/${f}`, "utf8").split(/^---$/m)[1];
  const src = fs.readFileSync(`packages/components/src/${c}.js`, "utf8");
  const attrs = [...t.matchAll(/name: ([\w-]+), kind: attribute/g)]
    .map((m) => m[1])
    .concat([...t.matchAll(/- name: ([\w-]+)\n\s+kind: attribute/g)].map((m) => m[1]));
  const events = [...t.matchAll(/name: ([\w-]+), kind: event/g)]
    .map((m) => m[1])
    .concat([...t.matchAll(/- name: ([\w-]+)\n\s+kind: event/g)].map((m) => m[1]));
  const miss = attrs.filter((a) => !new RegExp(`["'\\[ ]${a}["'\\] =]`).test(src));
  const dispatched = [...src.matchAll(/new (?:Custom)?Event\("([\w-]+)"/g)].map((m) => m[1]);
  const undoc = [...new Set(dispatched)].filter((e) => !events.includes(e));
  const pm = [...t.matchAll(/name: ([\w-]+), kind: attribute, parameter: accessibleName/g)].map(
    (m) => c + "=" + m[1],
  );
  names.push(...pm);
  console.log(
    c,
    "attrs",
    attrs.length,
    "notInSource:",
    miss.join(",") || "-",
    "| dispatchedNotInTable:",
    undoc.join(",") || "-",
  );
}
console.log("accessibleName→", names.join(" "));
