/**
 * Runs every docs example's Verify steps (`examples/<slug>.verify.js`) in
 * Chromium against the built site. A failure names the example and the step.
 * `turbo.json` makes this package's tests wait for its own build.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, expect, test } from "vitest";

import { exampleSlugs, verifyExample } from "../examples/verify.js";

const docsRoot = fileURLToPath(new URL("..", import.meta.url));
const distRoot = join(docsRoot, "dist");

const MIME: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const slugs = await exampleSlugs();
let server: Server;
let browser: Browser;
let baseUrl: string;

/** Serve dist/ the way the static host does: `/path` and `/path/` resolve to `index.html`. */
function serveDist(): Promise<Server> {
  const staticServer = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    let file = normalize(join(distRoot, pathname));
    if (!file.startsWith(distRoot)) {
      response.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
  });
  return new Promise((resolve) => staticServer.listen(0, "127.0.0.1", () => resolve(staticServer)));
}

beforeAll(async () => {
  if (!existsSync(join(distRoot, "index.html"))) {
    throw new Error(
      "examples.test.ts needs the built docs site. From the repo root run: pnpm exec turbo run build --filter=documentation",
    );
  }
  server = await serveDist();
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve));
});

test("every example has a Verify header that points at its steps", () => {
  expect(slugs.length).toBeGreaterThan(0);
  for (const slug of slugs) {
    const source = readFileSync(join(docsRoot, "examples", `${slug}.tsx`), "utf8");
    expect(source, `examples/${slug}.tsx Verify header`).toMatch(
      new RegExp(`^/\\*\\*\\n \\* Verify: .*\`${slug}\\.verify\\.js\``),
    );
    expect(existsSync(join(docsRoot, "examples", `${slug}.verify.js`)), `${slug}.verify.js`).toBe(
      true,
    );
  }
});

test.each(slugs)("the %s example passes its Verify steps", { timeout: 30_000 }, async (slug) => {
  const page = await browser.newPage();
  try {
    await verifyExample(page, baseUrl, slug);
  } finally {
    await page.close();
  }
});
