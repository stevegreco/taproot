import { flatten } from "@stevegreco/design-system/flatten";
import { formatAvoid, formatRule, referenceLabel } from "../render.js";
import { CHANNEL_CSS } from "./visuals.js";

/**
 * Generate the compiled Markdown body for a YAML-only component. The structured
 * record remains the only authored authority; this projection is compiler
 * output (KNOW-004, KNOW-007, KNOW-014, KNOW-024).
 *
 * @param {object} record
 * @returns {string}
 */
export function generateComponentBody(record) {
  const contract = record.contract;
  if (contract == null || typeof contract !== "object") {
    return record.summary;
  }

  const sections = [contract.description];

  const usageDo = contract.usage?.do ?? [];
  if (usageDo.length > 0) {
    sections.push(["## When to use", ...usageDo.map((item) => `- ${item.situation}`)].join("\n"));
  }

  const usageAvoid = contract.usage?.avoid ?? [];
  if (usageAvoid.length > 0) {
    sections.push(["## When to avoid", ...usageAvoid.map(formatAvoid)].join("\n"));
  }

  const content = contract.content ?? [];
  if (content.length > 0) {
    sections.push(["## Content", ...content.flatMap(formatRule)].join("\n"));
  }

  const behavior = contract.behavior ?? [];
  if (behavior.length > 0) {
    sections.push(["## Behavior", ...behavior.flatMap(formatRule)].join("\n"));
  }

  const parameters = Object.entries(contract.parameters ?? {});
  if (parameters.length > 0) {
    sections.push(["## Parameters", ...parameters.flatMap(formatParameter)].join("\n"));
  }

  const anatomy = contract.anatomy ?? [];
  if (anatomy.length > 0) {
    sections.push(
      [
        "## Anatomy",
        ...anatomy.map((part) => `- \`${part.name}\` (${part.role}): ${part.description}`),
      ].join("\n"),
    );
  }

  const states = (contract.states ?? []).filter((state) => state !== "default");
  if (states.length > 0) {
    sections.push(
      [
        "## States",
        `${states.map((state) => `\`${state}\``).join(", ")}, highest priority first. When two states set the same token channel, the earlier one wins.`,
      ].join("\n\n"),
    );
  }

  const events = Object.entries(contract.events ?? {});
  if (events.length > 0) {
    sections.push(
      [
        "## Events",
        ...events.map(([name, event]) => `- \`${name}\`: ${event.description ?? ""}`.trimEnd()),
      ].join("\n"),
    );
  }

  const accessibility = contract.accessibility;
  if (accessibility) {
    const lines = ["## Accessibility"];
    if (accessibility.semantics) lines.push(`- Semantics: ${accessibility.semantics}`);
    if (accessibility.name) lines.push(`- Accessible name: ${accessibility.name}`);
    for (const rule of accessibility.requirements ?? []) {
      lines.push(...formatRule(rule));
    }
    for (const binding of accessibility.keyboard ?? []) {
      lines.push(`- ${binding.key}: ${binding.action}`);
    }
    sections.push(lines.join("\n"));
  }

  const mappings = contract.mappings ?? [];
  if (mappings.length > 0) {
    sections.push(
      [
        "## Tokens",
        "Each row names the token a part uses for a channel. On the web, the channel sets the CSS property shown, and the token is the CSS custom property shown.",
        "",
        "| Part | Channel | When | Token | CSS |",
        "| --- | --- | --- | --- | --- |",
        ...mappings.map(formatMapping),
      ].join("\n"),
    );
  }

  return sections
    .filter((section) => typeof section === "string" && section.length > 0)
    .join("\n\n");
}

function formatParameter([name, parameter]) {
  const facts = [parameter.kind];
  if (Object.hasOwn(parameter, "default")) facts.push(`default \`${parameter.default}\``);
  const description = parameter.description ? `: ${parameter.description}` : "";
  const lines = [`- \`${name}\` (${facts.join(", ")})${description}`];
  for (const [value, text] of Object.entries(parameter.values ?? {})) {
    lines.push(`  - \`${value}\`: ${text}`);
  }
  return lines;
}

function formatMapping(mapping) {
  const when = [
    ...Object.entries(mapping.configuration ?? {}).map(([axis, value]) => `${axis}=${value}`),
    ...(mapping.state ? [mapping.state] : []),
  ];
  const token = mapping.token?.name ?? mapping.token?.literal ?? "";
  const value = mapping.token?.name ? `var(${cssVariable(mapping.token.name)})` : token;
  const css = `\`${CHANNEL_CSS[mapping.channel]}: ${value}\``;
  return `| ${mapping.part} | ${mapping.channel} | ${when.join(", ") || "always"} | \`${token}\` | ${css} |`;
}

/** The CSS custom property the token package publishes for a dotted token name. */
export function cssVariable(tokenName) {
  const tree = {};
  let cursor = tree;
  const segments = tokenName.split(".");
  for (const segment of segments.slice(0, -1)) cursor = cursor[segment] = {};
  cursor[segments.at(-1)] = "";
  return flatten(tree)[0].cssVariable;
}

/** How the web section describes an event that is not fired. */
const SUPPRESSED_WHEN = Object.freeze({
  "effectively-disabled": "while disabled, including inside a disabled fieldset",
});

/**
 * Sections the emitted Markdown file adds after a record's body, so each file answers the
 * next question without opening JSON: how to install and use a component on the web, its
 * examples' annotations, and the records to read next.
 *
 * @param {object} record
 * @param {{ stylesheet?: string, titleOf?: (id: string) => string|undefined, typeOf?: (id: string) => string|undefined }} [context]
 * @returns {string[]}
 */
export function generateReferenceSections(record, context = {}) {
  const sections = [];
  if (record.type === "component" && record.web) sections.push(...webSections(record, context));
  if (record.type === "example") sections.push(...annotationSections(record));
  sections.push(...relatedSections(record, context));
  return sections;
}

function webSections(record, context) {
  const host = record.web;
  const slug = record.id.slice(record.id.indexOf(".") + 1);
  const sections = [];

  const install = [
    "## Install and register",
    "",
    "```js",
    ...(context.stylesheet ? [`import "${context.stylesheet}";`] : []),
    `import { ${host.registration.export} } from "${host.package}/${slug}";`,
    "",
    `${host.registration.export}(); // registers <${host.defaultTagName}>`,
    "```",
  ];
  if (context.stylesheet) {
    install.splice(1, 0, `Import the token stylesheet once, then register the element.`);
  }
  if (host.registration.supportsAliases) {
    install.push(
      "",
      `Pass a tag name, as in \`${host.registration.export}("my-${slug}")\`, to register it under another name.`,
    );
  }
  sections.push(install.join("\n"));
  if (host.notes) sections.push(host.notes.trim());

  const parameters = Object.entries(host.parameters ?? {});
  if (parameters.length > 0) {
    sections.push(
      [
        "## Attributes",
        "| Parameter | Attribute | Property | Values |",
        "| --- | --- | --- | --- |",
        ...parameters.map(([name, mapped]) => {
          const values = Object.entries(mapped.values ?? {})
            .map(([portable, value]) => `${portable} → \`${value}\``)
            .join(", ");
          return `| ${name} | ${code(mapped.attribute)} | ${code(mapped.property)} | ${values} |`;
        }),
      ].join("\n"),
    );
  }

  const properties = Object.entries(host.properties ?? {});
  if (properties.length > 0) {
    sections.push(
      [
        "## Properties",
        ...properties.map(([name, property]) =>
          `- \`${name}\` (\`${property.type}\`${property.readonly ? ", read-only" : ""}): ${property.description ?? ""}`.trimEnd(),
        ),
      ].join("\n"),
    );
  }

  const slots = Object.entries(host.anatomy ?? {}).filter(([, node]) => node.slot);
  const parts = Object.entries(host.parts ?? {});
  if (slots.length > 0 || parts.length > 0) {
    const lines = ["## Slots and parts"];
    for (const [name, node] of slots) {
      const slotName = node.slot === "default" ? "the default slot" : `slot \`${node.slot}\``;
      const accepts = node.accepts?.length ? ` Accepts ${node.accepts.join(", ")}.` : "";
      lines.push(
        `- ${capitalize(slotName)} holds \`${name}\`${node.required ? " and is required" : ""}.${accepts}`,
      );
    }
    for (const [name, part] of parts) {
      lines.push(`- \`::part(${name})\`: ${part.description}`);
    }
    sections.push(lines.join("\n"));
  }

  const events = Object.entries(host.events ?? {});
  if (events.length > 0) {
    sections.push(
      [
        "## DOM events",
        ...events.map(([name, event]) => {
          const when = event.suppressedWhen
            ? ` Not fired ${SUPPRESSED_WHEN[event.suppressedWhen] ?? `when ${event.suppressedWhen}`}.`
            : "";
          return `- \`${event.event}\` for ${name}.${when}`;
        }),
      ].join("\n"),
    );
  }

  const form = host.formAssociation;
  if (form) {
    const facts = ["It is a form-associated custom element, so it takes part in its form."];
    if (form.fieldsetDisables) facts.push("A disabled fieldset disables it.");
    if (form.submitsValue) facts.push("It submits a value under its name.");
    if (form.submitRunsConstraintValidation) facts.push("Submitting runs constraint validation.");
    if (form.resetResetsAssociatedForm) facts.push("Reset resets the associated form.");
    sections.push(["## Forms", facts.join(" ")].join("\n\n"));
  }

  if (host.focus?.forwardsTo) {
    const target = host.focus.forwardsTo;
    const part = host.anatomy?.[target]?.part;
    const where = part ? `, \`::part(${part})\`` : "";
    sections.push(
      `## Focus\n\nFocusing the element moves focus to its \`${target}\` part${where}.`,
    );
  }

  if (host.example) sections.push(`## Example\n\n\`\`\`html\n${host.example.trim()}\n\`\`\``);
  return sections;
}

function annotationSections(record) {
  const annotations = record.annotations ?? [];
  if (annotations.length === 0) return [];
  return [
    [
      "## Annotations",
      ...annotations.map((note) => `- **${note.label}.** ${note.description}`),
    ].join("\n"),
  ];
}

/** Every record linked to this one, in either direction, grouped by type. */
function relatedSections(record, context) {
  const ids = [
    ...new Set([...(record.relations?.related ?? []), ...(record.backlinks?.related ?? [])]),
  ];
  if (ids.length === 0) return [];
  const typeOf = context.typeOf ?? ((id) => id.slice(0, id.indexOf(".")));
  const order = ["component", "pattern", "guideline", "example", "foundation", "decision"];
  const lines = ["## Related"];
  for (const type of order) {
    for (const id of ids.filter((item) => typeOf(item) === type).sort()) {
      const title = context.titleOf?.(id) ?? referenceLabel(id);
      lines.push(`- [${title}](markdown/${id}.md) (${type})`);
    }
  }
  return [lines.join("\n")];
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function code(value) {
  return value ? `\`${value}\`` : "";
}
