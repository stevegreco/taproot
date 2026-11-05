import { fromMarkdown } from "mdast-util-from-markdown";
import { typeFields } from "./schema/info.js";
import { isObject } from "./util.js";

/**
 * Something a link can point at inside a record.
 *
 * @typedef {object} SectionEntry
 * @property {string} title Heading text, rule id, field name, or annotation label.
 * @property {unknown} content Markdown for headings; a {@link ParameterValue} for an enum value;
 *   the rule, field value, or annotation otherwise.
 * @property {"heading" | "rule" | "field" | "value" | "annotation"} kind
 * @property {number} [depth] Heading level, for headings.
 */

/**
 * One value of an enum parameter, with the example and guidance the record pairs with it.
 *
 * @typedef {object} ParameterValue
 * @property {string} meaning What the value means.
 * @property {string} [example] Sample content, such as a label, from the parameter's `examples`.
 * @property {string} [guidance] The section that says when to choose the value, from `guidance`.
 */

/** GitHub-style heading slug: lowercase, punctuation removed, spaces to hyphens. */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s/gu, "-");
}

/**
 * Every valid section of a record, keyed by section address, in a stable order.
 *
 * @param {Record<string, any>} data The authored record.
 * @param {string | undefined} body Markdown body, for Markdown records.
 * @returns {Map<string, SectionEntry>}
 */
export function buildSections(data, body) {
  /** @type {Map<string, SectionEntry>} */
  const sections = new Map();
  const add = (address, entry) => {
    if (!sections.has(address)) sections.set(address, entry);
  };

  if (data.type === "component") addComponentSections(data, add);
  if (body) addHeadingSections(body, add);
  // After the headings, so a rule id that repeats a heading's slug never hides the heading.
  // Validation reports that collision.
  addRuleSections(data, add);
  if (data.type === "example" && Array.isArray(data.annotations)) {
    for (const annotation of data.annotations) {
      if (isObject(annotation) && typeof annotation.id === "string") {
        add(annotation.id, {
          title: annotation.label ?? annotation.id,
          content: annotation,
          kind: "annotation",
        });
      }
    }
  }
  return sections;
}

function addComponentSections(data, add) {
  const fields = new Set(typeFields("component"));
  for (const [key, value] of Object.entries(data)) {
    if (!fields.has(key)) continue;
    add(key, { title: key, content: value, kind: "field" });
    if (!isObject(value)) continue;
    if (key === "anatomy" || key === "events") {
      for (const [name, child] of Object.entries(value)) {
        add(`${key}.${name}`, { title: name, content: child, kind: "field" });
      }
    } else if (key === "parameters") {
      addParameters("parameters", value, add);
    } else if (key === "parts" || key === "items") {
      for (const [part, options] of Object.entries(value)) {
        const base = `${key}.${part}`;
        add(base, { title: part, content: options, kind: "field" });
        if (!isObject(options)) continue;
        if (isObject(options.parameters)) {
          add(`${base}.parameters`, {
            title: "parameters",
            content: options.parameters,
            kind: "field",
          });
          addParameters(`${base}.parameters`, options.parameters, add);
        }
        if (isObject(options.events)) {
          add(`${base}.events`, { title: "events", content: options.events, kind: "field" });
          for (const [name, text] of Object.entries(options.events)) {
            add(`${base}.events.${name}`, { title: name, content: text, kind: "field" });
          }
        }
      }
    }
  }
}

/** A rule's id is its section. A waived rule carries no rule of its own, so it has none. */
function addRuleSections(data, add) {
  for (const rule of Array.isArray(data.rules) ? data.rules : []) {
    if (isObject(rule) && typeof rule.id === "string" && rule.waived === undefined) {
      add(rule.id, { title: rule.id, content: rule, kind: "rule" });
    }
  }
}

function addParameters(path, parameters, add) {
  for (const [name, parameter] of Object.entries(parameters)) {
    add(`${path}.${name}`, { title: name, content: parameter, kind: "field" });
    for (const [option, meaning] of Object.entries(parameter?.values ?? {})) {
      add(`${path}.${name}.${option}`, {
        title: option,
        content: parameterValue(parameter, option, meaning),
        kind: "value",
      });
    }
  }
}

/** @returns {ParameterValue} */
function parameterValue(parameter, option, meaning) {
  const example = parameter.examples?.[option];
  const guidance = parameter.guidance?.[option];
  return {
    meaning,
    ...(example === undefined ? {} : { example }),
    ...(guidance === undefined ? {} : { guidance }),
  };
}

function addHeadingSections(body, add) {
  const headings = fromMarkdown(body).children.filter((node) => node.type === "heading");
  const slugs = headingSlugger();
  headings.forEach((heading, index) => {
    const title = plainText(heading).trim();
    const base = slugify(title);
    if (!base) return;
    const slug = slugs(base);
    const next = headings.slice(index + 1).find((later) => later.depth <= heading.depth);
    const content = body
      .slice(heading.position.end.offset, next ? next.position.start.offset : body.length)
      .trim();
    add(slug, { title, content, kind: "heading", depth: heading.depth });
  });
}

/**
 * Give each heading a slug no other heading in the record has, the way GitHub does: a repeated
 * slug gets `-1`, `-2`, and so on, skipping any suffix an earlier heading already took. Headings
 * `Foo`, `Foo`, and `Foo-1` are `foo`, `foo-1`, and `foo-1-1`.
 */
function headingSlugger() {
  const taken = new Map();
  return (base) => {
    let slug = base;
    while (taken.has(slug)) {
      const count = taken.get(base) + 1;
      taken.set(base, count);
      slug = `${base}-${count}`;
    }
    taken.set(slug, 0);
    return slug;
  };
}

function plainText(node) {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(plainText).join("");
}
