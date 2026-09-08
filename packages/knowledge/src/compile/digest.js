import { createHash } from "node:crypto";

export function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

export function shortRevision(data) {
  return sha256Hex(data).slice(0, 16);
}
