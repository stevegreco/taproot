/**
 * The `/components` catalog: one page listing every web component, generated from the spec.
 *
 * Each row gives the record's title and summary, and links to the component's page in Storybook.
 * A component with a web implementation file has a Storybook page, so those files decide the rows.
 * Everything else about a component stays in the spec (ADR 0007).
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSpec } from "@taproot-ds/spec";
import type { ContentSource, SourceEntry } from "blume/sources/types.ts";

export const STORYBOOK_URL = "https://storybook.stevegreco.workers.dev";

const TITLE = "Components";
const DESCRIPTION = "Every component in the design system, and when to use it.";

export interface CatalogRow {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly href: string;
}

function packageDir(name: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${name}/package.json`)));
}

const spec = await loadSpec({
  contentDir: join(packageDir("@taproot-ds/spec"), "content"),
});

/** Storybook's docs page id for a component: `Components/Text area` is `components-text-area--docs`. */
export function storybookHref(slug: string): string {
  return `${STORYBOOK_URL}/?path=/docs/components-${slug}--docs`;
}

/** Every row, sorted by title. */
export function catalogRows(): CatalogRow[] {
  return readdirSync(join(packageDir("@taproot-ds/web-components"), "implementation"))
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = file.slice(0, -".md".length);
      const record = spec.get(`component.${slug}`) as { title: string; summary: string };
      return { slug, title: record.title, summary: record.summary, href: storybookHref(slug) };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** The MDX body of the catalog page. */
export function catalogBody(rows: readonly CatalogRow[]): string {
  const table = rows.map(({ title, summary, href }) => `| [${title}](${href}) | ${summary} |`);
  return [
    `Follow a name to see the component and try it in [Storybook](${STORYBOOK_URL}). For its rules, API, and tokens, [use the spec with your AI agent or the command line](/getting-started/agents).`,
    ["| Component | When to use it |", "| --- | --- |", ...table].join("\n"),
  ].join("\n\n");
}

/** The Blume content source for `/components`. */
export function componentCatalogSource(): ContentSource {
  const text = `${catalogBody(catalogRows())}\n`;
  const entry: SourceEntry = {
    ref: "index.mdx",
    slug: "index",
    data: { title: TITLE, description: DESCRIPTION },
    body: { format: "mdx", text },
    raw: `---\ntitle: ${TITLE}\ndescription: ${DESCRIPTION}\n---\n\n${text}`,
  };
  return {
    name: "component-catalog",
    prefix: "components",
    staged: true,
    async load() {
      return { entries: [entry], diagnostics: [] };
    },
    async read() {
      return entry.raw!;
    },
  };
}
