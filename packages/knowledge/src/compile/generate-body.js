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

  return sections
    .filter((section) => typeof section === "string" && section.length > 0)
    .join("\n\n");
}

function formatAvoid(item) {
  let line = `- ${item.situation}`;
  if (item.instead) line += ` Use ${item.instead} instead.`;
  if (item.why) line += ` ${item.why}`;
  return line;
}

function formatRule(rule) {
  const lines = [`- **${rule.level}:** ${rule.statement}`];
  if (rule.applicability) {
    lines.push(`  Applies when: ${rule.applicability}`);
  }
  if (rule.rationale) {
    lines.push(`  Why: ${rule.rationale}`);
  }
  for (const reference of rule.references ?? []) {
    const hash = reference.fragment ? `#${reference.fragment}` : "";
    lines.push(`  See [${referenceLabel(reference.id)}](markdown/${reference.id}.md${hash}).`);
  }
  if (rule.examples?.do?.length) {
    lines.push(`  Do: ${rule.examples.do.join("; ")}.`);
  }
  if (rule.examples?.avoid?.length) {
    lines.push(`  Avoid: ${rule.examples.avoid.join("; ")}.`);
  }
  return lines;
}

function referenceLabel(id) {
  if (id === "pattern.action-hierarchy") return "action hierarchy pattern";
  const dot = id.indexOf(".");
  const rest = dot === -1 ? id : id.slice(dot + 1);
  return rest.replaceAll("-", " ").replaceAll(".", " ");
}
