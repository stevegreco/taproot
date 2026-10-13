/**
 * Runs the executable Verify steps for a docs example.
 *
 * Each `examples/<slug>.tsx` names its steps file, `examples/<slug>.verify.js`,
 * in its header comment. That file is the only copy of the steps. The docs tests
 * run every example against the built site (`test/examples.test.ts`); the
 * verify-design-system skill runs them against a dev server
 * (`control.mjs examples`).
 */
import { readdir } from "node:fs/promises";

import { exposedNodes } from "./accessibility.js";

const EXAMPLES_DIR = new URL("./", import.meta.url);

/** Every example slug: the basename of each `examples/*.tsx`. */
export async function exampleSlugs() {
  return (await readdir(EXAMPLES_DIR))
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.slice(0, -".tsx".length))
    .sort();
}

export class ExampleVerifyError extends Error {
  constructor(slug, stepName, cause) {
    super(
      `${slug} example, step "${stepName}": ${cause instanceof Error ? cause.message : cause}`,
      {
        cause,
      },
    );
    this.name = "ExampleVerifyError";
  }
}

/**
 * Open the component page and its example, then run the example's steps.
 * @param {import("playwright").Page} page
 * @param {string} baseUrl origin of the docs site, without a trailing slash
 * @param {string} slug
 */
export async function verifyExample(page, baseUrl, slug) {
  const step = async (name, run) => {
    try {
      await run();
    } catch (error) {
      if (error instanceof ExampleVerifyError) throw error;
      throw new ExampleVerifyError(slug, name, error);
    }
  };

  await step("the component page embeds the example", async () => {
    await page.goto(`${baseUrl}/components/${slug}/`);
    const src = await page.locator("iframe[data-blume-example-frame]").first().getAttribute("src");
    if (src?.replace(/\/$/, "") !== `/blume-examples/${slug}`) {
      throw new Error(`preview frame src is ${JSON.stringify(src)}`);
    }
  });

  await step("the example hydrates", async () => {
    await page.goto(`${baseUrl}/blume-examples/${slug}/`);
    await page.waitForFunction(
      () =>
        document.querySelector("astro-island") !== null &&
        document.querySelector("astro-island[ssr]") === null,
      undefined,
      { timeout: 10_000 },
    );
  });

  const { default: verify } = await import(new URL(`./${slug}.verify.js`, EXAMPLES_DIR).href);
  await verify({ page, step, eventually, exposedNodes: () => exposedNodes(page) });
}

/**
 * Poll `read` until it returns `expected`. Examples update after React renders,
 * so a single read can race the click that caused the change.
 * @param {() => Promise<unknown>} read
 * @param {unknown} expected
 * @param {string} what what is being read, for the failure message
 */
export async function eventually(read, expected, what, timeout = 5_000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const actual = await read();
    if (Object.is(actual, expected)) return;
    if (Date.now() > deadline) {
      throw new Error(`${what} is ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
