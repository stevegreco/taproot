/**
 * Writes dist/custom-elements.json, the custom elements manifest IDEs and framework tools read for
 * tag, attribute, property, event, slot, and CSS part help (schema 2.1.0,
 * https://github.com/webcomponents/custom-elements-manifest).
 *
 * Why it is built this way: the API tables in implementation/<name>.md already map each web
 * attribute, property, and event to a spec parameter or event, and packages/spec tests check them
 * against the source. This script joins those tables with the spec's descriptions, types, and
 * defaults, so the manifest says the same as `taproot get <name> --impl web`. Classes and tag names
 * come from the HTMLElementTagNameMap in src/<name>.d.ts; slots and CSS parts from the markup in
 * src/<name>.js.
 */

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { loadSpec } from "@taproot-ds/spec";
import { loadImplementations } from "@taproot-ds/spec/implementation";

const SRC = "src";
const OUT = "dist/custom-elements.json";

const spec = await loadSpec({});
const implementations = loadImplementations("implementation", "web-component");
const byComponent = new Map(implementations.map((impl) => [impl.component, impl]));

const names = (await readdir(SRC))
  .filter((file) => file.endsWith(".js") && file !== "index.js")
  .map((file) => file.slice(0, -".js".length))
  .sort();

const modules = [];
for (const name of names) {
  const path = `${SRC}/${name}.js`;
  const js = await readFile(path, "utf8");
  const dts = await readFile(`${SRC}/${name}.d.ts`, "utf8");
  const impl = byComponent.get(`component.${name}`);
  if (!impl) throw new Error(`implementation/${name}.md is missing for ${path}.`);
  const record = spec.get(impl.component);
  if (!record) throw new Error(`${impl.component} is not in the spec.`);

  const tagMap = dts.match(/interface HTMLElementTagNameMap \{([^}]*)\}/)?.[1] ?? "";
  const classOf = new Map(
    [...tagMap.matchAll(/"([a-z][\w-]*)": (\w+);/g)].map(([, tag, cls]) => [tag, cls]),
  );

  // The host element: its own rows and its parts' rows, which are attributes on the host.
  const hosts = [
    {
      tagName: impl.tagName,
      rows: [...impl.api, ...Object.values(impl.parts ?? {}).flatMap((part) => part.api ?? [])],
      parameters: {
        ...record.parameters,
        ...Object.assign({}, ...Object.values(record.parts ?? {}).map((p) => p.parameters)),
      },
      summary: record.summary,
      description: record.description,
      events: record.events ?? {},
      anatomy: record.anatomy ?? {},
    },
    // Items with their own custom element, such as an accordion section. An item that is a
    // native element, such as a radio group's options, has nothing to declare.
    ...Object.entries(impl.items ?? {})
      .filter(([, item]) => item.tagName?.includes("-"))
      .map(([key, item]) => ({
        tagName: item.tagName,
        rows: item.api ?? [],
        parameters: record.items?.[key]?.parameters ?? {},
        summary: record.items?.[key]?.description,
        description: undefined,
        events: {},
        anatomy: {},
      })),
  ];

  const declarations = hosts.map((host) => {
    const className = classOf.get(host.tagName);
    if (!className) {
      throw new Error(`src/${name}.d.ts maps no class to <${host.tagName}>.`);
    }
    return declaration(host, className, classSource(js, className));
  });

  const define = impl.defineExport;
  modules.push({
    kind: "javascript-module",
    path,
    declarations,
    exports: [
      ...declarations.flatMap((d) => [
        { kind: "js", name: d.name, declaration: { name: d.name, module: path } },
        {
          kind: "custom-element-definition",
          name: d.tagName,
          declaration: { name: d.name, module: path },
        },
      ]),
      ...(define
        ? [{ kind: "js", name: define, declaration: { name: define, module: path } }]
        : []),
    ],
  });
}

await mkdir("dist", { recursive: true });
await writeFile(
  OUT,
  `${JSON.stringify({ schemaVersion: "2.1.0", readme: "README.md", modules }, null, 2)}\n`,
);
console.log(`Wrote ${OUT}: ${modules.flatMap((m) => m.declarations).length} custom elements.`);

/** The text of one class, from its declaration to the next top-level declaration. */
function classSource(js, className) {
  const start = js.indexOf(`class ${className} `);
  if (start === -1) return "";
  const rest = js.slice(start + 1);
  const end = rest.search(/^(?:export )?(?:class|function|const) /m);
  return end === -1 ? rest : rest.slice(0, end);
}

function declaration(host, className, source) {
  const attributes = [];
  const fields = new Map();
  const events = [];
  for (const row of host.rows) {
    const parameter = row.parameter ? host.parameters?.[row.parameter] : undefined;
    const info = {
      type: row.type ? { text: row.type } : typeOf(parameter, row),
      description: row.description ?? describe(parameter, row),
      default: defaultOf(parameter, row),
    };
    if (row.kind === "attribute") {
      attributes.push(clean({ name: row.name, ...info, fieldName: undefined }));
    } else if (row.kind === "property") {
      fields.set(row.name, clean({ kind: "field", name: row.name, ...info }));
    } else if (row.kind === "event") {
      const description = row.description ?? (row.event ? host.events[row.event] : undefined);
      events.push(clean({ name: row.name, type: { text: "Event" }, description }));
    }
  }
  // An attribute whose camel-case name is a public accessor of the class reflects to it.
  for (const attribute of attributes) {
    const field = camel(attribute.name);
    if (!new RegExp(`^\\s+(?:get|set) ${field}\\(`, "m").test(source)) continue;
    attribute.fieldName = field;
    const existing = fields.get(field);
    fields.set(
      field,
      clean({
        kind: "field",
        name: field,
        type: existing?.type ?? attribute.type,
        description: existing?.description ?? attribute.description,
        default: existing?.default ?? attribute.default,
        attribute: attribute.name,
      }),
    );
  }

  const slots = unique(
    [...source.matchAll(/<slot(?:\s+name="([\w-]+)")?[\s>]/g)].map((m) => m[1] ?? ""),
  );
  const parts = unique([...source.matchAll(/part="([\w-]+)"/g)].map((m) => m[1]));
  return clean({
    kind: "class",
    name: className,
    tagName: host.tagName,
    customElement: true,
    summary: host.summary,
    description: host.description,
    superclass: { name: "HTMLElement" },
    attributes,
    members: [...fields.values()],
    events,
    slots: slots.map((slot) =>
      clean({ name: slot, description: slot ? host.anatomy[slot]?.description : undefined }),
    ),
    cssParts: parts.map((part) =>
      clean({ name: part, description: host.anatomy[part]?.description }),
    ),
  });
}

/** A TypeScript type text for a spec parameter, through the row's value mapping. */
function typeOf(parameter, row) {
  if (!parameter) return undefined;
  if (parameter.kind === "enum") {
    const values = Object.keys(parameter.values ?? {}).map((value) => row.values?.[value] ?? value);
    return { text: values.map((value) => JSON.stringify(value)).join(" | ") };
  }
  const text = { boolean: "boolean", number: "number", string: "string" }[parameter.kind];
  return text ? { text } : undefined;
}

function describe(parameter, row) {
  if (!parameter) return undefined;
  const lines = [parameter.description?.trim()];
  if (parameter.kind === "enum") {
    for (const [value, text] of Object.entries(parameter.values ?? {})) {
      lines.push(`- \`${row.values?.[value] ?? value}\`: ${text}`);
    }
  }
  return lines.filter(Boolean).join("\n") || undefined;
}

function defaultOf(parameter, row) {
  if (parameter?.default === undefined) return undefined;
  const value = row.values?.[parameter.default] ?? parameter.default;
  return JSON.stringify(value);
}

function camel(name) {
  return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function unique(list) {
  return [...new Set(list)];
}

/** Drops undefined fields and empty arrays, as the manifest's optional fields allow. */
function clean(object) {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== undefined && !(Array.isArray(value) && value.length === 0),
    ),
  );
}
