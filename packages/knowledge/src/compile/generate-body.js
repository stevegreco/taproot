import { formatAvoid, formatRule } from "../render.js";

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
        "| Part | Channel | When | Token |",
        "| --- | --- | --- | --- |",
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
  return `| ${mapping.part} | ${mapping.channel} | ${when.join(", ") || "always"} | \`${token}\` |`;
}

/**
 * Sections the emitted Markdown file adds after a record's body, so each file answers the
 * next question without opening JSON: a component lists its web-component API and example.
 *
 * @param {object} record
 * @returns {string[]}
 */
export function generateReferenceSections(record) {
  if (record.type !== "component" || !record.web) return [];

  const host = record.web;
  const sections = [];
  const summary = [];
  if (host.defaultTagName) summary.push(`- Tag: \`<${host.defaultTagName}>\``);
  if (host.package) summary.push(`- Package: \`${host.package}\``);
  if (host.registration?.export) summary.push(`- Register: \`${host.registration.export}()\``);
  if (summary.length > 0) sections.push(["## Web component", ...summary].join("\n"));
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

  const events = Object.entries(host.events ?? {});
  if (events.length > 0) {
    sections.push(
      [
        "## Events",
        ...events.map(([name, event]) => {
          const suppressed = event.suppressedWhen ? ` Not fired when ${event.suppressedWhen}.` : "";
          return `- \`${event.event}\` for ${name}.${suppressed}`;
        }),
      ].join("\n"),
    );
  }

  if (host.example) sections.push(`## Example\n\n\`\`\`html\n${host.example.trim()}\n\`\`\``);
  return sections;
}

function code(value) {
  return value ? `\`${value}\`` : "";
}
