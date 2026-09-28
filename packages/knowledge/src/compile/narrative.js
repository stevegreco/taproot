import { posix } from "node:path";
import { fromMarkdown } from "mdast-util-from-markdown";
import { parseFragment } from "parse5";
import { visit } from "unist-util-visit";
import { PROBLEM, problem } from "./tables.js";

const MARKDOWN_VIEW_DIR = "markdown";

export function rewriteBodyLinks(body, context) {
  const tree = fromMarkdown(body);
  const replacements = [];
  const references = [];
  const problems = [];

  visit(tree, (node) => {
    if (node.type === "html") {
      for (const destination of htmlDestinations(node.value)) {
        const resolved = resolveBodyUrl(destination.url, context, true);
        if (resolved.kind === "leave") continue;
        if (resolved.kind === "error") {
          problems.push(
            problem({
              code: PROBLEM.BODY_UNRESOLVED_LINK,
              message: `unresolved HTML reference ${destination.url}`,
              recordId: context.recordId,
              path: context.authoredPath,
            }),
          );
          continue;
        }
        references.push(resolved.reference);
        if (resolved.url !== destination.url) {
          replacements.push({
            start: node.position.start.offset + destination.start,
            end: node.position.start.offset + destination.end,
            text: `${destination.name}="${escapeAttribute(resolved.url)}"`,
          });
        }
      }
      return;
    }
    if (
      node.type === "linkReference" ||
      node.type === "imageReference" ||
      node.type === "definition"
    ) {
      problems.push(
        problem({
          code: PROBLEM.BODY_UNRESOLVED_LINK,
          message: `unsupported reference-style Markdown ${node.type}`,
          recordId: context.recordId,
          path: context.authoredPath,
        }),
      );
      return;
    }
    if (node.type !== "link" && node.type !== "image") return;
    const url = node.url ?? "";
    const resolved = resolveBodyUrl(url, context);
    if (resolved.kind === "leave") return;
    if (resolved.kind === "error") {
      problems.push(
        problem({
          code: PROBLEM.BODY_UNRESOLVED_LINK,
          message: `unresolved relative link ${url}`,
          recordId: context.recordId,
          path: context.authoredPath,
        }),
      );
      return;
    }
    references.push(resolved.reference);
    if (resolved.url !== url) {
      const range = destinationRange(body, node);
      if (range) replacements.push({ ...range, text: resolved.url });
    }
  });

  let next = body;
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    next = next.slice(0, replacement.start) + replacement.text + next.slice(replacement.end);
  }

  return { body: next, references, problems };
}

/**
 * Convert bundle-root-relative destinations in a JSON record body into paths that
 * resolve from an emitted file inside `markdown/`.
 */
export function rewriteEmittedMarkdownUrls(body) {
  const tree = fromMarkdown(body);
  const replacements = [];

  visit(tree, (node) => {
    if (node.type === "html") {
      for (const destination of htmlDestinations(node.value)) {
        const next = toMarkdownFileUrl(destination.url);
        if (next === destination.url) continue;
        replacements.push({
          start: node.position.start.offset + destination.start,
          end: node.position.start.offset + destination.end,
          text: `${destination.name}="${escapeAttribute(next)}"`,
        });
      }
      return;
    }
    if (node.type !== "link" && node.type !== "image") return;
    const url = node.url ?? "";
    const next = toMarkdownFileUrl(url);
    if (next === url) return;
    const range = destinationRange(body, node);
    if (range) replacements.push({ ...range, text: next });
  });

  let rewritten = body;
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    rewritten =
      rewritten.slice(0, replacement.start) + replacement.text + rewritten.slice(replacement.end);
  }
  return rewritten;
}

export function markdownDestinations(body) {
  const destinations = [];
  const tree = fromMarkdown(body);
  visit(tree, (node) => {
    if (node.type === "html") {
      for (const destination of htmlDestinations(node.value)) {
        destinations.push(destination.url);
      }
      return;
    }
    if (node.type === "link" || node.type === "image") {
      destinations.push(node.url ?? "");
    }
  });
  return destinations;
}

export function toMarkdownFileUrl(url) {
  if (!url || url.startsWith("#")) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//")) return url;

  const hashIndex = url.indexOf("#");
  const pathPart = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex);
  if (!pathPart || pathPart.startsWith("/")) return url;
  if (!pathPart.startsWith(`${MARKDOWN_VIEW_DIR}/`) && !pathPart.startsWith("assets/")) {
    return url;
  }
  return `${posix.relative(MARKDOWN_VIEW_DIR, pathPart)}${hash}`;
}

function resolveBodyUrl(url, context, allowBundlePath = false) {
  if (!url) {
    return { kind: "error" };
  }
  if (url.startsWith("#")) {
    return { kind: "leave" };
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//")) {
    return { kind: "leave" };
  }

  const hashIndex = url.indexOf("#");
  const pathPart = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex);
  if (!pathPart) {
    return { kind: "leave" };
  }
  if (pathPart.startsWith("/")) {
    return { kind: "error" };
  }

  const viewId = pathPart.startsWith(`${MARKDOWN_VIEW_DIR}/`)
    ? pathPart.slice(MARKDOWN_VIEW_DIR.length + 1, -".md".length)
    : null;
  if (viewId && pathPart.endsWith(".md") && recordIds(context).has(viewId)) {
    return { kind: "ok", url, reference: { kind: "record", target: viewId } };
  }
  if (allowBundlePath) {
    for (const target of context.assetPathToBundlePath.values()) {
      if (pathPart === target) {
        return { kind: "ok", url, reference: { kind: "asset", target } };
      }
    }
  }

  const resolved = posix.normalize(posix.join(posix.dirname(context.authoredPath), pathPart));
  const recordId = context.recordIdByPath.get(resolved);
  if (recordId) {
    return {
      kind: "ok",
      url: `markdown/${recordId}.md${hash}`,
      reference: { kind: "record", target: recordId },
    };
  }
  const bundlePath = context.assetPathToBundlePath.get(resolved);
  if (bundlePath) {
    return {
      kind: "ok",
      url: `${bundlePath}${hash}`,
      reference: { kind: "asset", target: bundlePath },
    };
  }
  return { kind: "error" };
}

const idSets = new WeakMap();

function recordIds(context) {
  let ids = idSets.get(context.recordIdByPath);
  if (!ids) {
    ids = new Set(context.recordIdByPath.values());
    idSets.set(context.recordIdByPath, ids);
  }
  return ids;
}

function* htmlDestinations(html) {
  const root = parseFragment(html, { sourceCodeLocationInfo: true });
  function* walk(node) {
    for (const attribute of node.attrs ?? []) {
      if (!["href", "src", "poster"].includes(attribute.name)) continue;
      const name = attribute.prefix ? `${attribute.prefix}:${attribute.name}` : attribute.name;
      const location = node.sourceCodeLocation?.attrs?.[name];
      if (location)
        yield { name, url: attribute.value, start: location.startOffset, end: location.endOffset };
    }
    for (const child of node.childNodes ?? []) yield* walk(child);
    if (node.content) yield* walk(node.content);
  }
  yield* walk(root);
}

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * The source range of an inline link or image destination, without its angle brackets.
 * Replacing only this range keeps a linked image's two destinations from overlapping, and
 * it finds destinations written with backslash escapes, whose source differs from `node.url`.
 */
function destinationRange(body, node) {
  if (!node.position) return null;
  const start = node.position.start.offset;
  const slice = body.slice(start, node.position.end.offset);
  if (!slice.endsWith(")")) return null;
  // The destination follows the last `](`; a nested image's destination comes earlier.
  const open = slice.lastIndexOf("](");
  if (open === -1) return null;
  let at = open + 2;
  while (/\s/.test(slice[at] ?? "")) at += 1;
  if (slice[at] === "<") {
    const close = slice.indexOf(">", at);
    return close === -1 ? null : { start: start + at + 1, end: start + close };
  }
  let end = at;
  let depth = 0;
  while (end < slice.length) {
    const char = slice[end];
    if (char === "\\") {
      end += 2;
      continue;
    }
    if (/\s/.test(char)) break;
    if (char === "(") depth += 1;
    if (char === ")") {
      if (depth === 0) break;
      depth -= 1;
    }
    end += 1;
  }
  return end > at ? { start: start + at, end: start + end } : null;
}
