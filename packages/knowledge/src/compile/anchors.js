import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";

/** A heading's anchor, using the GitHub rule the docs site also follows. */
export function headingSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

/** Anchors of every heading in a Markdown body. */
export function headingAnchors(body) {
  const anchors = new Set();
  visit(fromMarkdown(body), "heading", (node) => {
    anchors.add(headingSlug(plainText(node)));
  });
  return anchors;
}

/** Anchors of `###` headings followed by text before the next heading. */
export function subsectionAnchors(body) {
  const anchors = new Set();
  const children = fromMarkdown(body).children;
  for (const [index, node] of children.entries()) {
    if (node.type !== "heading" || node.depth !== 3) continue;
    const next = children[index + 1];
    if (next && next.type !== "heading") anchors.add(headingSlug(plainText(node)));
  }
  return anchors;
}

function plainText(node) {
  const parts = [];
  visit(node, (child) => {
    if (child.type === "text" || child.type === "inlineCode") parts.push(child.value);
  });
  return parts.join("");
}
