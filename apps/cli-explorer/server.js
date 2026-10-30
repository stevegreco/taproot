import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { fileURLToPath } from "node:url";

/**
 * A local web page for trying `ds-spec` commands. Each run calls the real CLI twice, once for
 * the Markdown an agent reads and once with `--json`, so the page shows exactly what the CLI
 * returns. It listens on localhost only.
 */

const root = fileURLToPath(new URL("../../", import.meta.url));
const cli = fileURLToPath(new URL("../../packages/spec/bin/ds-spec.js", import.meta.url));
const page = fileURLToPath(new URL("./index.html", import.meta.url));
const tokens = fileURLToPath(new URL("../../packages/tokens/dist/css/tokens.css", import.meta.url));
const port = Number(process.env.PORT ?? 4400);

/** Run the CLI from the repository root, so it finds spec.config.json. */
function runCli(args) {
  const started = performance.now();
  return new Promise((resolve) => {
    execFile(process.execPath, [cli, ...args], { cwd: root }, (error, stdout, stderr) => {
      resolve({
        exitCode: error ? (error.code ?? 1) : 0,
        stdout,
        stderr,
        ms: Math.round(performance.now() - started),
      });
    });
  });
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return JSON.parse(body || "{}");
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(await readFile(page));
      return;
    }
    if (request.method === "GET" && request.url === "/tokens.css") {
      // Built by the tokens package. Without it the page falls back to browser defaults.
      const css = await readFile(tokens).catch(() => "");
      response.writeHead(200, { "content-type": "text/css; charset=utf-8" });
      response.end(css);
      return;
    }
    if (request.method === "POST" && request.url === "/run") {
      const { args } = await readBody(request);
      if (!Array.isArray(args) || !args.every((arg) => typeof arg === "string")) {
        response.writeHead(400).end("args must be an array of strings");
        return;
      }
      const withoutJson = args.filter((arg) => arg !== "--json");
      const [text, json] = await Promise.all([
        runCli(withoutJson),
        runCli([...withoutJson, "--json"]),
      ]);
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ text, json }));
      return;
    }
    response.writeHead(404).end("Not found");
  } catch (error) {
    response.writeHead(500).end(error.message);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`CLI Explorer: http://localhost:${port}`);
  if (!existsSync(tokens)) {
    console.log("Tokens are not built yet. Run `pnpm --filter @stevegreco/design-system build`.");
  }
});
