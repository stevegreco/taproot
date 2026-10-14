/**
 * A new component starts as a draft record with only the fields the schema requires. Each text
 * the author must write is a placeholder that starts with `TODO:`, and validation reports every
 * placeholder until it is replaced.
 */

/** A placeholder value: text that starts with `TODO`. */
export const PLACEHOLDER = /^TODO\b/;

const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/** `radio-group` → `Radio group`, the way existing component titles are written. */
export function titleOf(name) {
  const words = name.replaceAll("-", " ");
  return words[0].toUpperCase() + words.slice(1);
}

/**
 * The YAML of a draft component record named `name`, such as `tooltip` or `radio-group`.
 *
 * @param {string} name
 * @param {{ header?: string }} [options] A first line, such as a yaml-language-server comment.
 */
export function draftComponent(name, options = {}) {
  if (!NAME.test(name)) {
    throw new Error(`"${name}" is not a component name: use lowercase words joined by hyphens`);
  }
  const title = titleOf(name);
  return [
    ...(options.header ? [options.header] : []),
    `id: component.${name}`,
    "type: component",
    `title: ${title}`,
    `summary: "TODO: Use ${title} to … (one sentence that says when to use it)"`,
    "status: draft",
    'description: "TODO: What it shows or does, in a sentence or two."',
    "usage:",
    "  do:",
    '    - "TODO: A concrete situation it is for."',
    "  avoid:",
    `    - situation: "TODO: A situation ${title} looks right for but isn't."`,
    '      instead: "TODO: A record ID, such as component.button, or plain text when none exists."',
    '      why: "TODO: Why the other choice fits better."',
    "anatomy:",
    "  container:",
    "    role: container",
    '    description: "TODO: What this part is. Name each part in reading order."',
    "",
  ].join("\n");
}
