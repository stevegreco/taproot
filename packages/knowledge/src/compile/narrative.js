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
    if (resolved.url !== url && node.position) {
      replacements.push({
        start: node.position.start.offset,
        end: node.position.end.offset,
        text: replaceDestination(
          body.slice(node.position.start.offset, node.position.end.offset),
          url,
          resolved.url,
        ),
      });
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
    if (next === url || !node.position) return;
    replacements.push({
      start: node.position.start.offset,
      end: node.position.end.offset,
      text: replaceDestination(
        body.slice(node.position.start.offset, node.position.end.offset),
        url,
        next,
      ),
    });
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

  for (const id of context.recordIdByPath.values()) {
    if (pathPart === `markdown/${id}.md`) {
      return { kind: "ok", url, reference: { kind: "record", target: id } };
    }
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

function replaceDestination(slice, oldUrl, newUrl) {
  const wrapped = `(${oldUrl})`;
  const at = slice.lastIndexOf(wrapped);
  if (at !== -1) {
    return slice.slice(0, at) + `(${newUrl})` + slice.slice(at + wrapped.length);
  }
  const titled = `(${oldUrl} `;
  const titledAt = slice.lastIndexOf(titled);
  if (titledAt !== -1) {
    return slice.slice(0, titledAt) + `(${newUrl} ` + slice.slice(titledAt + titled.length);
  }
  const angled = `(<${oldUrl}>)`;
  const angledAt = slice.lastIndexOf(angled);
  if (angledAt !== -1) {
    return slice.slice(0, angledAt) + `(<${newUrl}>)` + slice.slice(angledAt + angled.length);
  }
  return slice.replace(oldUrl, newUrl);
}
