/**
 * Keeps each spec record and its web component in step. The spec tooling checks that an
 * implementation file maps every parameter, value, and event, but not that the web source does
 * what that file says. These tests read the source in packages/components/src and fail when one
 * side changes without the other:
 *
 * - the tokens a component's stylesheet uses against the record's token map
 * - the attributes, values, properties, and events in the implementation file against the source
 *
 * They read the source as text, so they check names, not behavior. Component tests cover behavior.
 * They run in Node, apart from the browser tests, because they read files.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TOKEN_KEYWORDS, loadSpec } from "@taproot-ds/spec";
import { resolveConfig } from "@taproot-ds/spec/config";
import { loadImplementations } from "@taproot-ds/spec/implementation";

const root = fileURLToPath(new URL("../../../..", import.meta.url));
const config = resolveConfig({ cwd: root });
const web = config.implementations.web;
const sourceDir = fileURLToPath(new URL("../../src", import.meta.url));

/** Global attributes a component may observe without listing them in its API table. */
const GLOBAL_ATTRIBUTES = new Set(["hidden"]);

/**
 * Native events that cross the shadow boundary on their own, so a component can document them
 * without dispatching them: `click` from the host, `input` from an inner native control.
 */
const NATIVE_EVENTS = new Set(["click", "input"]);

const withoutComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const read = (file) => withoutComments(readFileSync(path.join(sourceDir, file), "utf8"));

/** `semantic.typography.body.md.fontFamily` → `semantic-typography-body-md-font-family` */
const cssName = (token) =>
  token
    .split(".")
    .map((segment) => segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase())
    .join("-");

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Each element of an implementation: the host, then each item and part, with the record's
 * parameters for that element.
 */
function elements(implementation, record) {
  return [
    { name: implementation.tagName, api: implementation.api, parameters: record.parameters },
    ...Object.entries(implementation.items ?? {}).map(([key, item]) => ({
      name: item.tagName,
      api: item.api ?? [],
      parameters: record.items?.[key]?.parameters,
    })),
    ...Object.entries(implementation.parts ?? {}).map(([key, part]) => ({
      name: `${implementation.tagName} part ${key}`,
      api: part.api ?? [],
      parameters: record.parts?.[key]?.parameters,
    })),
  ];
}

async function components() {
  const spec = await loadSpec({ contentDir: config.contentDir });
  return loadImplementations(web.folder, web.technology).map((implementation) => {
    const slug = implementation.component.slice("component.".length);
    return {
      implementation,
      record: spec.get(implementation.component),
      tokens: spec.tokens(implementation.component),
      js: read(`${slug}.js`),
      css: read(`${slug}.css`),
      slug,
    };
  });
}

describe("web components against their spec records", () => {
  it("use exactly the tokens in the record's token map", async () => {
    const constants = new Set(Object.values(config.constants).map(cssName));
    const problems = [];

    for (const { implementation, record, tokens, css, slug } of await components()) {
      const id = implementation.component;
      const keywords = tokens.filter((binding) => TOKEN_KEYWORDS.includes(binding.token));
      const inSpec = new Set(
        tokens
          .filter((binding) => !TOKEN_KEYWORDS.includes(binding.token))
          .map((binding) => cssName(binding.token)),
      );
      const inCss = new Set(
        [...css.matchAll(/--ds-((?:semantic|primitives)-[a-z0-9-]+)/g)].map((match) => match[1]),
      );
      const decisions = (record.rationale ?? []).map(({ decision }) => cssName(decision ?? ""));

      for (const name of inSpec) {
        if (!inCss.has(name)) {
          problems.push(`${id} maps --ds-${name}, but ${slug}.css doesn't use it`);
        }
      }
      for (const { token, part, property } of keywords) {
        if (!new RegExp(`\\b${escape(token)}\\b`).test(css)) {
          problems.push(
            `${id} maps ${part} ${property} to ${token}, but ${slug}.css never uses it`,
          );
        }
      }
      for (const name of inCss) {
        if (inSpec.has(name) || constants.has(name)) continue;
        // A token the map can't express, such as a multiple of one, is allowed when a rationale
        // decision names it.
        if (decisions.some((decision) => decision.includes(name))) continue;
        problems.push(
          `${slug}.css uses --ds-${name}, but ${id} doesn't map it. Add it to the token map, or name it in a rationale decision.`,
        );
      }
    }

    expect(problems).toEqual([]);
  });

  it("implement every attribute and value in the API table", async () => {
    const problems = [];

    for (const { implementation, record, js, css, slug } of await components()) {
      const source = `${js}\n${css}`;
      for (const element of elements(implementation, record)) {
        for (const entry of element.api) {
          if (entry.kind !== "attribute") continue;
          const name = escape(entry.name);
          const found =
            new RegExp(`["'\`]${name}["'\`]`).test(js) ||
            new RegExp(`\\[${name}(?:[\\]=~|^$*])`).test(css);
          if (!found) {
            problems.push(
              `${element.name}: the API table lists the ${entry.name} attribute, but ${slug}.js and ${slug}.css never read it`,
            );
            continue;
          }

          const parameter = entry.parameter && element.parameters?.[entry.parameter];
          if (parameter?.kind !== "enum") continue;
          for (const value of Object.keys(parameter.values)) {
            const attributeValue = escape(String(entry.values?.[value] ?? value));
            // A quoted string in the script or stylesheet, or a key of a lookup object.
            const used =
              new RegExp(`["'\`]${attributeValue}["'\`]`).test(source) ||
              new RegExp(`[{,]\\s*${attributeValue}\\s*:`).test(js);
            if (!used) {
              problems.push(
                `${element.name}: ${entry.name}="${entry.values?.[value] ?? value}" (${entry.parameter} ${value}) never appears in ${slug}.js or ${slug}.css`,
              );
            }
          }
        }
      }
    }

    expect(problems).toEqual([]);
  });

  it("list every observed attribute in the API table", async () => {
    const problems = [];

    for (const { implementation, record, js, slug } of await components()) {
      const documented = new Set(
        elements(implementation, record).flatMap((element) =>
          element.api.filter((entry) => entry.kind === "attribute").map((entry) => entry.name),
        ),
      );
      const observed = [...js.matchAll(/observedAttributes\s*=\s*\[([^\]]*)\]/g)].flatMap((match) =>
        [...match[1].matchAll(/["']([\w-]+)["']/g)].map((name) => name[1]),
      );
      for (const name of observed) {
        if (documented.has(name) || GLOBAL_ATTRIBUTES.has(name)) continue;
        problems.push(
          `${slug}.js observes the ${name} attribute, but implementation/${slug}.md doesn't list it`,
        );
      }
    }

    expect(problems).toEqual([]);
  });

  it("define every property and method in the API table", async () => {
    const problems = [];

    for (const { implementation, record, js, slug } of await components()) {
      for (const element of elements(implementation, record)) {
        for (const entry of element.api) {
          if (entry.kind !== "property") continue;
          const name = escape(entry.name);
          if (!new RegExp(`^\\s*(?:get |async )?${name}\\s*\\(`, "m").test(js)) {
            problems.push(
              `${element.name}: the API table lists the ${entry.name} property, but ${slug}.js defines no getter or method by that name`,
            );
          }
        }
      }
    }

    expect(problems).toEqual([]);
  });

  it("dispatch exactly the events in the API table", async () => {
    const problems = [];

    for (const { implementation, record, js, slug } of await components()) {
      const documented = new Set(
        elements(implementation, record).flatMap((element) =>
          element.api.filter((entry) => entry.kind === "event").map((entry) => entry.name),
        ),
      );
      const dispatched = new Set(
        [...js.matchAll(/new (?:Custom)?Event\(\s*["']([\w-]+)["']/g)].map((match) => match[1]),
      );
      for (const name of dispatched) {
        if (!documented.has(name)) {
          problems.push(
            `${slug}.js dispatches ${name}, but implementation/${slug}.md doesn't list it`,
          );
        }
      }
      for (const name of documented) {
        if (!dispatched.has(name) && !NATIVE_EVENTS.has(name)) {
          problems.push(
            `implementation/${slug}.md lists the ${name} event, but ${slug}.js never dispatches it`,
          );
        }
      }
    }

    expect(problems).toEqual([]);
  });

  it("export the define function each implementation file names", async () => {
    const problems = [];

    for (const { implementation, js, slug } of await components()) {
      const name = escape(implementation.defineExport);
      if (!new RegExp(`export (?:async )?function ${name}\\b|export const ${name}\\b`).test(js)) {
        problems.push(`${slug}.js doesn't export ${implementation.defineExport}`);
      }
    }

    expect(problems).toEqual([]);
  });
});
