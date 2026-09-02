#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, open, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const command = process.argv[2];
const runId = process.argv[3];
const port = Number(process.argv[4] ?? 4321);

if (!command || !runId || !/^[a-zA-Z0-9_-]+$/.test(runId)) {
  fail("Usage: control.mjs <launch|doctor|border|cleanup> <run-id> [port]");
}

if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  fail("Port must be an integer from 1024 through 65535");
}

const runDir = path.join(root, ".cursor", "verification-runs", runId);
const metadataPath = path.join(runDir, "instance.json");
const baseUrl = `http://127.0.0.1:${port}`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function readMetadata() {
  try {
    return JSON.parse(await readFile(metadataPath, "utf8"));
  } catch {
    fail(`No verification instance metadata at ${metadataPath}`);
  }
}

async function pageIdentity(url) {
  const response = await fetch(url);
  const body = await response.text();
  return {
    ok: response.ok && body.includes("<title>") && body.includes("Design System"),
    status: response.status,
    hasTitle: body.includes("Design System"),
  };
}

async function waitUntilReady() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const identity = await pageIdentity(baseUrl);
      if (identity.ok) return identity;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Documentation did not become ready at ${baseUrl}`);
}

async function launch() {
  try {
    const existing = await pageIdentity(baseUrl);
    if (existing.status) fail(`Port ${port} already answers HTTP; choose another port`);
  } catch {}

  await mkdir(runDir, { recursive: true });
  try {
    const existing = JSON.parse(await readFile(metadataPath, "utf8"));
    if (isRunning(existing.pid)) fail(`Run ${runId} already owns process ${existing.pid}`);
  } catch {}

  const log = await open(path.join(runDir, "server.log"), "a");
  const child = spawn(
    "pnpm",
    ["--filter", "documentation", "dev", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: root,
      detached: true,
      env: process.env,
      stdio: ["ignore", log.fd, log.fd],
    },
  );
  child.unref();

  const metadata = { pid: child.pid, port, baseUrl, runId, startedAt: new Date().toISOString() };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

  try {
    const identity = await waitUntilReady();
    console.log(JSON.stringify({ ...metadata, ...identity }, null, 2));
  } catch (error) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {}
    throw error;
  } finally {
    await log.close();
  }
}

async function doctor() {
  const metadata = await readMetadata();
  if (metadata.port !== port || metadata.baseUrl !== baseUrl) {
    fail(`Run ${runId} owns ${metadata.baseUrl}, not ${baseUrl}`);
  }
  if (!isRunning(metadata.pid)) fail(`Owned process ${metadata.pid} is not running`);

  const identity = await pageIdentity(baseUrl);
  if (!identity.ok) fail(`Unexpected page identity at ${baseUrl}`);
  console.log(JSON.stringify({ ...metadata, ...identity, processRunning: true }, null, 2));
}

async function verifyBorderLab() {
  await doctor();
  const evidenceDir = path.join(runDir, "border-lab");
  await mkdir(evidenceDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${baseUrl}/labs/border`, { waitUntil: "networkidle" });

    const lab = page.locator('[aria-label="Semantic border lab"]');
    const stage = page.locator("[data-border-stage]");
    const thin = page.locator('[data-border-size-button="thin"]');
    const thick = page.locator('[data-border-size-button="thick"]');
    await lab.waitFor({ state: "visible" });

    const before = {
      stageSize: await stage.getAttribute("data-border-size"),
      thinPressed: await thin.getAttribute("aria-pressed"),
      thickPressed: await thick.getAttribute("aria-pressed"),
    };
    await page.screenshot({ path: path.join(evidenceDir, "before.png"), fullPage: true });
    await writeFile(path.join(evidenceDir, "before.aria.yml"), `${await lab.ariaSnapshot()}\n`);

    await thin.click();
    await stage.evaluate((element) => {
      if (element.getAttribute("data-border-size") !== "thin") {
        throw new Error("Border stage did not switch to thin");
      }
    });

    const after = {
      stageSize: await stage.getAttribute("data-border-size"),
      thinPressed: await thin.getAttribute("aria-pressed"),
      thickPressed: await thick.getAttribute("aria-pressed"),
    };
    await page.screenshot({ path: path.join(evidenceDir, "after.png"), fullPage: true });
    await writeFile(path.join(evidenceDir, "after.aria.yml"), `${await lab.ariaSnapshot()}\n`);

    const result = {
      feature: "border-lab-width",
      url: page.url(),
      title: await page.title(),
      action: 'Selected "Thin · 1px"',
      before,
      after,
      passed:
        before.stageSize === "thick" &&
        before.thickPressed === "true" &&
        after.stageSize === "thin" &&
        after.thinPressed === "true" &&
        after.thickPressed === "false",
    };
    await writeFile(path.join(evidenceDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
    if (!result.passed) fail(`Border lab assertion failed; inspect ${evidenceDir}`);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

async function cleanup() {
  const metadata = await readMetadata();
  if (isRunning(metadata.pid)) {
    try {
      process.kill(-metadata.pid, "SIGTERM");
    } catch (error) {
      fail(`Could not stop owned process group ${metadata.pid}: ${error.message}`);
    }

    const deadline = Date.now() + 5_000;
    while (isRunning(metadata.pid) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (isRunning(metadata.pid)) process.kill(-metadata.pid, "SIGKILL");
  }
  console.log(`Stopped run ${runId}; evidence retained at ${runDir}`);
}

const actions = { launch, doctor, border: verifyBorderLab, cleanup };
if (!actions[command]) fail(`Unknown command: ${command}`);

try {
  await actions[command]();
} catch (error) {
  fail(error instanceof Error ? (error.stack ?? error.message) : String(error));
}
