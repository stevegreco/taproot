/**
 * `/components/<slug>` pages, rendered from the catalog.
 *
 * Every public component with a web section gets a page: title and description
 * from the record, the import snippet from its package and
 * registration export, the usage snippet from its `example`, the
 * live example from `examples/<slug>.tsx`, and the `<ComponentKnowledge>`
 * sections that have content.
 *
 * `docs/components/<slug>.mdx` is optional prose, shown as the preview
 * introduction. The filesystem source excludes those files so they only render
 * here, and a prose file without a matching component fails the build.
 */
import { existsSync, readFileSync, readdirSync, watch } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ContentSource, SourceEntry } from "blume/sources/types.ts";
import { componentSlugs, loadComponentSlice, type ComponentSlice } from "./component-knowledge";

/** Folder under the content root that holds optional prose, one file per slug. */
export const PROSE_FOLDER = "components";
/** Installed alongside the components: every element paints with its CSS variables. */
const TOKENS_PACKAGE = "@stevegreco/design-system";

const proseDir = fileURLToPath(new URL(`../docs/${PROSE_FOLDER}/`, import.meta.url));
const examplesDir = fileURLToPath(new URL("../examples/", import.meta.url));

/** Optional prose files, by slug. */
function proseFiles(): Map<string, string> {
  if (!existsSync(proseDir)) return new Map();
  return new Map(
    readdirSync(proseDir)
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => [file.slice(0, -".mdx".length), `${proseDir}${file}`]),
  );
}

/** A `<CodeBlock>` whose code is a template literal, so the page source stays readable. */
function codeBlock(lang: string, code: string): string {
  const literal = code.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${");
  return `<CodeBlock\n  lang="${lang}"\n  code={\`${literal}\`}\n/>`;
}

/** A front matter value, quoted only when plain YAML would misread it. */
function yamlValue(value: string): string {
  return /^[\s\-?]|[:#[\]{}&*!|>'"%@`]|\s$/.test(value) ? JSON.stringify(value) : value;
}

function knowledge(slug: string, section: string): string {
  return `<ComponentKnowledge component="${slug}" section="${section}" />`;
}

/** The MDX body of one component page. */
export function componentPageBody(
  slice: ComponentSlice,
  options: { prose?: string; hasExample: boolean },
): string {
  const { slug } = slice;
  const parts = ['<Badge variant="accent">Web component</Badge>', knowledge(slug, "intro")];

  if (options.prose || options.hasExample) {
    parts.push("## Preview");
    if (options.prose) parts.push(options.prose);
    if (options.hasExample) parts.push(`<Component path="${slug}" />`);
  }

  parts.push(
    "## Import",
    codeBlock("bash", `pnpm add ${TOKENS_PACKAGE} ${slice.packageName}`),
    codeBlock(
      "js",
      `import { ${slice.defineExport} } from "${slice.packageName}/${slug}";\n\n${slice.defineExport}();`,
    ),
  );

  if (slice.usageHtml || slice.behaviorMarkdown) parts.push("## Usage");
  if (slice.usageHtml) parts.push(codeBlock("html", slice.usageHtml));
  if (slice.behaviorMarkdown) parts.push(knowledge(slug, "behavior"));

  if (slice.variants.length > 0) parts.push("## Variants", knowledge(slug, "variants"));
  if (slice.together) parts.push("## Using together", knowledge(slug, "together"));
  parts.push("## API", knowledge(slug, "api"));
  parts.push("## Accessibility", knowledge(slug, "accessibility"));
  if (slice.review) parts.push(knowledge(slug, "review"));

  return `${parts.join("\n\n")}\n`;
}

function pageEntry(slug: string, prosePath: string | undefined): SourceEntry {
  const slice = loadComponentSlice(slug);
  const text = componentPageBody(slice, {
    prose: prosePath ? readFileSync(prosePath, "utf8").trim() : undefined,
    hasExample: existsSync(`${examplesDir}${slug}.tsx`),
  });
  const data = { title: slice.title, description: slice.summary };
  const frontmatter = Object.entries(data)
    .map(([key, value]) => `${key}: ${yamlValue(value)}`)
    .join("\n");
  return {
    ref: `${slug}.mdx`,
    slug,
    data,
    body: { format: "mdx", text },
    raw: `---\n${frontmatter}\n---\n\n${text}`,
  };
}

/** Every component page, in catalog order. */
export function componentPageEntries(): SourceEntry[] {
  const slugs = componentSlugs();
  const prose = proseFiles();
  const orphans = [...prose.keys()].filter((slug) => !slugs.includes(slug));
  if (orphans.length > 0) {
    throw new Error(
      `docs/${PROSE_FOLDER}/ has prose for ${orphans.join(", ")}, but the catalog has no public component with a web section for it. Component pages render from the catalog; that folder holds only optional preview prose.`,
    );
  }
  return slugs.map((slug) => pageEntry(slug, prose.get(slug)));
}

/** The Blume content source for `/components/<slug>`. */
export function componentPagesSource(): ContentSource {
  let entries = new Map<string, SourceEntry>();
  return {
    name: "component-pages",
    prefix: PROSE_FOLDER,
    staged: true,
    async load() {
      const list = componentPageEntries();
      entries = new Map(list.map((entry) => [entry.ref, entry]));
      return { entries: list, diagnostics: [] };
    },
    async read(ref) {
      const entry = entries.get(ref);
      if (!entry?.raw) throw new Error(`No component page ${ref}`);
      return entry.raw;
    },
    watch(onChange) {
      if (!existsSync(proseDir)) return () => {};
      const watcher = watch(proseDir, onChange);
      return () => watcher.close();
    },
  };
}
