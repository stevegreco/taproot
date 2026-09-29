import { createHash } from "node:crypto";

export function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

export function shortRevision(data) {
  return sha256Hex(data).slice(0, 16);
}

/** The manifest digest: sha256 over the manifest content with keys sorted. */
export function contentDigest(content) {
  return `sha256:${sha256Hex(JSON.stringify(sortKeys(content)))}`;
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])]),
    );
  }
  return value;
}
