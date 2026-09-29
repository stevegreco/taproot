/**
 * Markdown for contract rules and usage entries. The compiler uses these for
 * generated component bodies, and the docs site uses them for component pages,
 * so both say the same thing the same way.
 */

/** A usage `avoid` entry as one Markdown list item. */
export function formatAvoid(item) {
  let line = `- ${item.situation}`;
  if (item.instead) line += ` Use ${item.instead} instead.`;
  if (item.why) line += ` ${item.why}`;
  return line;
}

/** A content, behavior, or accessibility rule as a Markdown list item with indented detail lines. */
export function formatRule(rule) {
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
    lines.push(`  Do: ${sentence(rule.examples.do.join("; "))}`);
  }
  if (rule.examples?.avoid?.length) {
    lines.push(`  Avoid: ${sentence(rule.examples.avoid.join("; "))}`);
  }
  return lines;
}

/** `pattern.action-hierarchy` reads as "action hierarchy pattern". */
export function referenceLabel(id) {
  const dot = id.indexOf(".");
  if (dot === -1) return id.replaceAll("-", " ");
  const type = id.slice(0, dot);
  const name = id
    .slice(dot + 1)
    .replaceAll("-", " ")
    .replaceAll(".", " ");
  return `${name} ${type}`;
}

/** End with a period unless the text already ends a sentence. */
function sentence(text) {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}
