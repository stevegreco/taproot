/**
 * The data behind a component page, assembled from two sources.
 *
 * - The spec library (`@stevegreco/design-system-spec`) supplies usage,
 *   rules, anatomy, parameters, states, accessibility, patterns, and examples.
 * - The components package's implementation files
 *   (`packages/components/implementation/<slug>.md`) supply everything
 *   specific to the web component: package, tag name, usage markup, the API
 *   table's rows, and web guidance.
 *
 * A spec component with an implementation file gets a page. An
 * implementation file whose component is not in the spec fails the build.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSpec } from "@stevegreco/design-system-spec";
import {
  checkImplementation,
  ImplementationError,
  implementationSlug,
  loadImplementations,
  type ApiMemberKind,
  type Implementation,
  type ImplementationApiRow,
} from "./implementation";

export type { ApiMemberKind } from "./implementation";

export type ComponentSlug = string;

export type ComponentSpecSection =
  | "intro"
  | "behavior"
  | "variants"
  | "together"
  | "api"
  | "accessibility"
  | "review";

export type CheckLevel = "must" | "should" | "may";
export type RecordStatus = "draft" | "stable" | "deprecated";

export interface Variant {
  readonly name: string;
  readonly description: string;
  readonly guidance: string;
  readonly isDefault: boolean;
  readonly exampleHtml: string;
  readonly exampleLabel: string;
}

export interface ApiValue {
  readonly name: string;
  readonly description: string;
}

export interface ApiRow {
  readonly name: string;
  readonly typeDisplay: string;
  readonly defaultDisplay: string | undefined;
  readonly description: string;
  readonly kind: ApiMemberKind;
  readonly values: readonly ApiValue[];
}

/** The child element that realizes one item or part, such as Accordion's sections. */
export interface ItemApi {
  /** The record item or part, such as `section`. */
  readonly name: string;
  readonly tagName: string;
  readonly api: readonly ApiRow[];
}

export interface KeyboardBinding {
  readonly key: string;
  readonly action: string;
}

export interface AccessibilitySection {
  readonly keyboard: readonly KeyboardBinding[];
  readonly requirements: readonly string[];
}

export interface ExampleAnnotation {
  readonly label: string;
  readonly description: string;
}

export interface ExampleFigure {
  readonly title: string;
  readonly summary: string;
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly annotations: readonly ExampleAnnotation[];
}

export interface TogetherPattern {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly avoid: readonly string[];
}

export interface TogetherSection {
  /** Every pattern the component links to, by id. */
  readonly patterns: readonly TogetherPattern[];
  readonly example: ExampleFigure | undefined;
}

export interface ReviewCheck {
  readonly id: string;
  readonly level: CheckLevel;
  readonly requirement: string;
  /** When the rule applies, if not always. */
  readonly applicability?: string;
}

export interface ReviewSection {
  readonly title: string;
  readonly checks: readonly ReviewCheck[];
}

export interface ComponentSlice {
  readonly slug: ComponentSlug;
  readonly title: string;
  readonly summary: string;
  readonly status: RecordStatus;
  readonly tagName: string;
  /** npm package that publishes the element, from the implementation file. */
  readonly packageName: string;
  /** The registration function, exported from `<packageName>/<slug>`. */
  readonly defineExport: string;
  /** The implementation file's usage markup, or empty when it has none. */
  readonly usageHtml: string;
  readonly introMarkdown: string;
  readonly behaviorMarkdown: string;
  readonly variants: readonly Variant[];
  readonly api: readonly ApiRow[];
  readonly items: readonly ItemApi[];
  readonly accessibility: AccessibilitySection;
  readonly together: TogetherSection | undefined;
  readonly review: ReviewSection | undefined;
}

export type DocsSpecCode =
  | "invalid-slug"
  | "missing-component"
  | "invalid-implementation"
  | "unexpected-slice"
  | "unknown-section";

export class DocsSpecError extends Error {
  readonly code: DocsSpecCode;

  constructor(code: DocsSpecCode, message: string) {
    super(message);
    this.name = "DocsSpecError";
    this.code = code;
  }
}

/** The parts of the loaded spec this module reads. */
export interface SpecSource {
  readonly contentDir: string;
  get(id: string): unknown;
  section(target: string): { content: unknown } | undefined;
  links(id: string): readonly { to: string; kind: string }[];
}

interface Rule {
  id: string;
  level: CheckLevel;
  topic: "content" | "behavior" | "accessibility";
  statement: string;
  applicability?: string;
  rationale?: string;
  references?: string[];
  examples?: { do?: string[]; avoid?: string[] };
}

interface Parameter {
  kind: string;
  description?: string;
  values?: Record<string, string>;
  examples?: Record<string, string>;
  guidance?: Record<string, string>;
  default?: unknown;
}

interface RecordBase {
  id: string;
  type: string;
  title: string;
  summary: string;
  status: RecordStatus;
  file: string;
  "known-issues"?: { statement: string; issue?: string }[];
}

/** What API rows implement: the component's own parameters and events, or one part's or item's. */
interface ApiOwner {
  parameters?: Record<string, Parameter>;
  events?: Record<string, string>;
}

interface ComponentRecord extends RecordBase, ApiOwner {
  description: string;
  usage?: { avoid?: { situation: string; instead?: string; why?: string }[] };
  parts?: Record<string, ApiOwner>;
  items?: Record<string, ApiOwner>;
  rules?: Rule[];
  accessibility?: { keyboard?: Record<string, string> };
}

interface ExampleRecord extends RecordBase {
  assets?: { path: string; alt: string; width: number; height: number }[];
  annotations?: { label: string; description: string }[];
}

const SLUG = /^[a-z][a-z0-9-]*$/;
const SECTIONS: readonly ComponentSpecSection[] = [
  "intro",
  "behavior",
  "variants",
  "together",
  "api",
  "accessibility",
  "review",
];
const TOPIC_ORDER = ["content", "behavior", "accessibility"] as const;

function assertSlug(slug: string): asserts slug is ComponentSlug {
  if (!SLUG.test(slug)) {
    throw new DocsSpecError(
      "invalid-slug",
      `"${slug}" is not a component page slug. Use "button", not "component.button".`,
    );
  }
}

export function loadComponentSlice(slug: string): ComponentSlice {
  assertSlug(slug);
  const slice = slices.get(slug);
  if (!slice) {
    throw new DocsSpecError(
      "missing-component",
      `No component page for "${slug}". It needs the record component.${slug} and a packages/components/implementation/${slug}.md file.`,
    );
  }
  return slice;
}

/** Slugs of every component with a page, in file-name order. */
export function componentSlugs(): readonly ComponentSlug[] {
  return [...slices.keys()];
}

export function componentSpecMarkdown(slug: string, section?: string): string {
  const slice = loadComponentSlice(slug);
  if (section == null) {
    return SECTIONS.map((name) => renderSectionMarkdown(slice, name))
      .filter((part) => part.length > 0)
      .join("\n\n");
  }
  if (!isSection(section)) {
    throw new DocsSpecError("unknown-section", `"${section}" is not a component page section.`);
  }
  return renderSectionMarkdown(slice, section);
}

function isSection(value: string): value is ComponentSpecSection {
  return (SECTIONS as readonly string[]).includes(value);
}

function markdownTable(headings: string[], rows: string[][]): string {
  return [
    `| ${headings.join(" | ")} |`,
    `| ${headings.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(markdownCell).join(" | ")} |`),
  ].join("\n");
}

function markdownCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function apiDescription(row: ApiRow): string {
  if (row.values.length > 0) {
    return row.values.map((value) => `${value.name}: ${value.description}`).join("; ");
  }
  return row.description;
}

function apiTable(rows: readonly ApiRow[]): string {
  return markdownTable(
    ["Name", "Kind", "Type", "Default", "Description"],
    rows.map((row) => [
      row.name,
      row.kind,
      row.typeDisplay,
      row.defaultDisplay ?? "",
      apiDescription(row),
    ]),
  );
}

function renderSectionMarkdown(slice: ComponentSlice, section: ComponentSpecSection): string {
  switch (section) {
    case "intro":
      return slice.introMarkdown;
    case "behavior":
      return slice.behaviorMarkdown;
    case "variants":
      return slice.variants
        .flatMap((variant) => {
          const parts = [`### ${variant.name}`, variant.description];
          if (variant.guidance) parts.push(variant.guidance);
          parts.push(`\`${variant.exampleHtml}\``);
          return parts;
        })
        .join("\n\n");
    case "together": {
      if (!slice.together) return "";
      const { patterns } = slice.together;
      const titled = patterns.length > 1;
      const parts: string[] = [];
      for (const pattern of patterns) {
        if (titled) parts.push(`### ${pattern.title}`);
        parts.push(pattern.summary);
      }
      if (slice.together.example) {
        parts.push(
          `![${slice.together.example.alt}](${slice.together.example.src})`,
          ...slice.together.example.annotations.map(
            (annotation) => `- **${annotation.label}:** ${annotation.description}`,
          ),
        );
      }
      for (const pattern of patterns) {
        if (pattern.avoid.length === 0) continue;
        parts.push(
          titled ? `#### Avoid: ${pattern.title}` : "### Avoid",
          ...pattern.avoid.map((item) => `- ${item}`),
        );
      }
      return parts.filter((part) => part.length > 0).join("\n\n");
    }
    case "api":
      return [
        ...(slice.api.length > 0 ? [apiTable(slice.api)] : []),
        ...slice.items.flatMap((item) => [`### \`<${item.tagName}>\``, apiTable(item.api)]),
      ].join("\n\n");
    case "accessibility": {
      const parts: string[] = [];
      if (slice.accessibility.keyboard.length > 0) {
        parts.push(
          markdownTable(
            ["Key", "Action"],
            slice.accessibility.keyboard.map((binding) => [binding.key, binding.action]),
          ),
        );
      }
      if (slice.accessibility.requirements.length > 0) {
        parts.push(slice.accessibility.requirements.map((item) => `- ${item}`).join("\n"));
      }
      return parts.join("\n\n");
    }
    case "review":
      if (!slice.review) return "";
      return [
        `### ${slice.review.title}`,
        slice.review.checks.map((check) => `- ${checkText(check)}`).join("\n"),
      ].join("\n\n");
  }
}

// -- Reading the spec ------------------------------------------------------

function fail(code: DocsSpecCode, message: string): never {
  throw new DocsSpecError(code, message);
}

function recordOf<T extends RecordBase>(spec: SpecSource, target: string): T | undefined {
  const id = target.split("#")[0];
  return spec.get(id) as T | undefined;
}

function slugOf(componentId: string): string {
  return componentId.slice("component.".length);
}

/** Where a record's page lives, or undefined when it has none. */
function docsHref(record: RecordBase, pages: ReadonlySet<string>): string | undefined {
  if (record.type === "component") {
    const slug = slugOf(record.id);
    return pages.has(slug) ? `/components/${slug}` : undefined;
  }
  if (record.type === "pattern" || record.type === "example") return "#using-together";
  return undefined;
}

/** `pattern.action-hierarchy` reads as "action hierarchy pattern". */
function referenceLabel(record: RecordBase): string {
  const name = record.id
    .slice(record.type.length + 1)
    .replaceAll("-", " ")
    .replaceAll(".", " ");
  return `${name} ${record.type}`;
}

/** End with a period unless the text already ends a sentence. */
function sentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/** A usage `avoid` entry as one Markdown list item. */
function formatAvoid(
  spec: SpecSource,
  pages: ReadonlySet<string>,
  item: { situation: string; instead?: string; why?: string },
): string {
  let line = `- ${item.situation}`;
  if (item.instead) {
    const target = recordOf<RecordBase>(spec, item.instead);
    const href = target ? docsHref(target, pages) : undefined;
    const name = target ? target.title : item.instead;
    line += ` Use ${href ? `[${name}](${href})` : name} instead.`;
  }
  if (item.why) line += ` ${item.why}`;
  return line;
}

/** A rule as a Markdown list item with indented detail lines. */
function formatRule(spec: SpecSource, pages: ReadonlySet<string>, rule: Rule): string[] {
  const lines = [`- **${rule.level}:** ${rule.statement}`];
  if (rule.applicability) lines.push(`  Applies when: ${rule.applicability}`);
  if (rule.rationale) lines.push(`  Why: ${rule.rationale}`);
  for (const reference of rule.references ?? []) {
    const target = recordOf<RecordBase>(spec, reference);
    if (!target) continue;
    const href = docsHref(target, pages);
    lines.push(`  See ${href ? `[${referenceLabel(target)}](${href})` : referenceLabel(target)}.`);
  }
  if (rule.examples?.do?.length) lines.push(`  Do: ${sentence(rule.examples.do.join("; "))}`);
  if (rule.examples?.avoid?.length) {
    lines.push(`  Avoid: ${sentence(rule.examples.avoid.join("; "))}`);
  }
  return lines;
}

function bulletItems(markdown: string): string[] {
  return markdown.split("\n").flatMap((line) => {
    const match = line.match(/^[-*]\s+(.*)$/);
    return match?.[1] ? [match[1]] : [];
  });
}

/** The `##` sections of a Markdown body, as `### Heading` blocks. Code fences are left whole. */
function bodySections(body: string): string {
  const parts: string[] = [];
  let current: string[] = [];
  let fenced = false;
  const flush = () => {
    const text = current.join("\n").trim();
    if (text) parts.push(text);
    current = [];
  };
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) fenced = !fenced;
    const heading = !fenced ? line.match(/^##\s+(.+)$/) : null;
    if (heading) {
      flush();
      current.push(`### ${heading[1].trim()}`);
    } else {
      current.push(line);
    }
  }
  flush();
  return parts.join("\n\n");
}

// -- The API table ----------------------------------------------------------

function enumTypeDisplay(names: readonly string[]): string {
  return names.map((name) => `"${name}"`).join(" | ");
}

function defaultDisplay(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value : JSON.stringify(value);
}

function projectRow(owner: ApiOwner, row: ImplementationApiRow): ApiRow {
  if (row.kind === "event") {
    const spec = row.event ? owner.events?.[row.event] : undefined;
    return {
      name: row.name,
      kind: "event",
      typeDisplay: "event",
      defaultDisplay: undefined,
      description: row.description ?? spec ?? "",
      values: [],
    };
  }
  if (!row.parameter) {
    return {
      name: row.name,
      kind: row.kind,
      typeDisplay: row.type ?? "",
      defaultDisplay: undefined,
      description: row.description ?? "",
      values: [],
    };
  }

  // checkImplementation has confirmed the parameter and every renamed value exist.
  const parameter = owner.parameters![row.parameter]!;
  const rename = row.values ?? {};
  const values: ApiValue[] = Object.entries(parameter.values ?? {}).map(([name, description]) => ({
    name: rename[name] ?? name,
    description,
  }));
  const defaultValue = defaultDisplay(parameter.default);
  return {
    name: row.name,
    kind: row.kind,
    typeDisplay:
      row.type ??
      (parameter.kind === "enum" ? enumTypeDisplay(values.map((v) => v.name)) : parameter.kind),
    defaultDisplay: defaultValue === undefined ? undefined : (rename[defaultValue] ?? defaultValue),
    description: row.description ?? parameter.description ?? "",
    values,
  };
}

// -- Sections ---------------------------------------------------------------

function projectVariants(
  implementation: Implementation,
  record: ComponentRecord,
  guidance: (variant: string) => string,
): Variant[] {
  const variant = record.parameters?.variant;
  if (!variant?.values || Object.keys(variant.values).length === 0) return [];
  const row = implementation.api.find((item) => item.parameter === "variant");
  const attribute = row?.name ?? "variant";
  const rename = row?.values ?? {};
  return Object.entries(variant.values).map(([name, description]) => {
    // Authored on the record's variant parameter; the value name is the fallback.
    const label = variant.examples?.[name] ?? name.replace(/^./, (first) => first.toUpperCase());
    const web = rename[name] ?? name;
    return {
      name: web,
      description,
      guidance: guidance(name),
      isDefault: name === variant.default,
      exampleHtml: `<${implementation.tagName} ${attribute}="${web}">${label}</${implementation.tagName}>`,
      exampleLabel: label,
    };
  });
}

function projectAccessibility(record: ComponentRecord): AccessibilitySection {
  return {
    keyboard: Object.entries(record.accessibility?.keyboard ?? {}).map(([key, action]) => ({
      key,
      action,
    })),
    requirements: (record.rules ?? [])
      .filter((rule) => rule.topic === "accessibility")
      .map((rule) => checkText({ requirement: rule.statement, applicability: rule.applicability })),
  };
}

/** The review checklist: every rule, content first, in the order the page presents them. */
function projectReview(record: ComponentRecord): ReviewSection | undefined {
  const rules = record.rules ?? [];
  const checks = TOPIC_ORDER.flatMap((topic) =>
    rules
      .filter((rule) => rule.topic === topic)
      .map((rule) => ({
        id: rule.id,
        level: rule.level,
        requirement: rule.statement,
        ...(rule.applicability ? { applicability: rule.applicability } : {}),
      })),
  );
  return checks.length > 0 ? { title: "Review checklist", checks } : undefined;
}

/** A requirement with the condition it applies under, so a conditional rule never reads as unconditional. */
export function checkText(check: Pick<ReviewCheck, "requirement" | "applicability">): string {
  return check.applicability
    ? `${check.requirement} Applies when: ${check.applicability}`
    : check.requirement;
}

function projectExample(
  record: ExampleRecord,
  assetDir: string,
  contentDir: string,
): ExampleFigure {
  const asset = record.assets?.[0];
  if (!asset) fail("unexpected-slice", `${record.id} has no assets to show.`);
  const file = basename(asset.path);
  const to = join(assetDir, record.id);
  mkdirSync(to, { recursive: true });
  copyFileSync(join(contentDir, dirname(record.file), asset.path), join(to, file));
  return {
    title: record.title,
    summary: record.summary,
    src: `/spec-assets/${record.id}/${file}`,
    alt: asset.alt,
    width: asset.width,
    height: asset.height,
    annotations: (record.annotations ?? []).map((item) => ({
      label: item.label,
      description: item.description,
    })),
  };
}

interface Context {
  readonly spec: SpecSource;
  readonly pages: ReadonlySet<string>;
  readonly assetDir: string;
}

function projectComponent(context: Context, implementation: Implementation): ComponentSlice {
  const { spec, pages, assetDir } = context;
  const found = recordOf<ComponentRecord>(spec, implementation.component);
  const slug = implementationSlug(implementation);
  // The spec CLI runs the same check, so the site and `get --impl` agree on what is valid.
  try {
    checkImplementation(implementation, found);
  } catch (error) {
    if (error instanceof ImplementationError) fail("invalid-implementation", error.message);
    throw error;
  }
  const record = found as ComponentRecord;
  // A part without its own element is set on the component, so its rows join the component's table.
  const parts = Object.entries(implementation.parts).map(([name, part]) => ({
    name,
    tagName: part.tagName,
    api: part.api.map((row) => projectRow(record.parts![name]!, row)),
  }));
  const api = [
    ...implementation.api.map((row) => projectRow(record, row)),
    ...parts.filter((part) => !part.tagName).flatMap((part) => part.api),
  ];
  const items = [
    ...parts.flatMap((part) => (part.tagName ? [{ ...part, tagName: part.tagName }] : [])),
    ...Object.entries(implementation.items).map(([name, item]) => ({
      name,
      tagName: item.tagName,
      api: item.api.map((row) => projectRow(record.items![name]!, row)),
    })),
  ];

  // Patterns the component links to, by any link kind, and the examples of those or of the component.
  const outgoing = spec.links(record.id);
  const patternIds = [
    ...new Set(
      outgoing.flatMap((link) =>
        recordOf<RecordBase>(spec, link.to)?.type === "pattern" ? [link.to.split("#")[0]] : [],
      ),
    ),
  ].sort();
  const patterns = patternIds.map((id) => recordOf<RecordBase>(spec, id) as RecordBase);
  const exampleIds = [
    ...new Set(
      [record.id, ...patternIds].flatMap((id) =>
        spec
          .links(id)
          .filter(
            (link) =>
              (link.kind === "examples" || link.kind === "related") &&
              recordOf<RecordBase>(spec, link.to)?.type === "example",
          )
          .map((link) => link.to.split("#")[0]),
      ),
    ),
  ].sort();
  if (exampleIds.length > 1) {
    fail(
      "unexpected-slice",
      `${record.id} links to more than one example (${exampleIds.join(", ")}); the page shows one.`,
    );
  }
  const example = exampleIds[0]
    ? projectExample(
        recordOf<ExampleRecord>(spec, exampleIds[0]) as ExampleRecord,
        assetDir,
        spec.contentDir,
      )
    : undefined;

  // Each variant value names its guidance section in the spec (`parameters.variant.guidance`).
  const guidance = (variant: string): string => {
    const target = record.parameters?.variant?.guidance?.[variant];
    const section = target ? spec.section(target) : undefined;
    return typeof section?.content === "string" ? section.content : "";
  };

  const use = (record.usage?.do ?? []).map((situation) => `- ${situation}`);
  const avoid = (record.usage?.avoid ?? []).map((item) => formatAvoid(spec, pages, item));
  const knownIssues = (record["known-issues"] ?? []).map(
    (entry) => `- ${entry.statement}${entry.issue ? ` ([tracking issue](${entry.issue}))` : ""}`,
  );
  const introParts = [record.description];
  if (knownIssues.length > 0) introParts.push(`### Known issues\n\n${knownIssues.join("\n")}`);
  if (use.length > 0) introParts.push(`### When to use\n\n${use.join("\n")}`);
  if (avoid.length > 0) introParts.push(`### When to avoid\n\n${avoid.join("\n")}`);

  const contentLines = (record.rules ?? [])
    .filter((rule) => rule.topic === "content")
    .flatMap((rule) => formatRule(spec, pages, rule));
  const behaviorParts = [
    contentLines.length > 0 ? `### Write the content\n\n${contentLines.join("\n")}` : "",
    bodySections(implementation.body),
  ];

  const together =
    patterns.length === 0 && !example
      ? undefined
      : {
          patterns: patterns.map((pattern) => {
            const avoidSection = spec.section(`${pattern.id}#avoid`);
            return {
              id: pattern.id,
              title: pattern.title,
              summary: pattern.summary,
              avoid: bulletItems(
                typeof avoidSection?.content === "string" ? avoidSection.content : "",
              ),
            };
          }),
          example,
        };

  return {
    slug,
    title: record.title,
    summary: record.summary,
    status: record.status,
    tagName: implementation.tagName,
    packageName: implementation.package,
    defineExport: implementation.defineExport,
    usageHtml: implementation.usage,
    introMarkdown: introParts.filter((part) => part.length > 0).join("\n\n"),
    behaviorMarkdown: behaviorParts.filter((part) => part.length > 0).join("\n\n"),
    variants: projectVariants(implementation, record, guidance),
    api,
    items,
    accessibility: projectAccessibility(record),
    together,
    review: projectReview(record),
  };
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Object.isFrozen(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) deepFreeze(item);
  } else {
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return Object.freeze(value);
}

/**
 * One slice per implementation file, in file-name order. Copies each example's
 * image into `assetDir/<example id>/` so the page can serve it.
 */
export function assembleSlices(
  spec: SpecSource,
  implementations: readonly Implementation[],
  assetDir: string,
): ReadonlyMap<string, ComponentSlice> {
  const pages = new Set(implementations.map(implementationSlug));
  const context: Context = { spec, pages, assetDir };
  const map = new Map<string, ComponentSlice>();
  for (const implementation of implementations) {
    const slice = deepFreeze(projectComponent(context, implementation));
    map.set(slice.slug, slice);
  }
  return Object.freeze(map);
}

/**
 * The docs app's root. Astro bundles this module into `dist/`, where its own
 * URL no longer points into the app, so walk up to the package that owns `public/`.
 */
function docsRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(dir, "public")) || !existsSync(join(dir, "package.json"))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error("Could not find the docs app root (public/).");
    dir = parent;
  }
  return dir;
}

/** The web components' implementation files, resolved the same way in source and in the bundle. */
export function implementationDir(): string {
  const manifest = fileURLToPath(import.meta.resolve("@stevegreco/web-components/package.json"));
  return join(dirname(manifest), "implementation");
}

/** The spec package's content folder, resolved the same way in source and in the bundle. */
function specContentDir(): string {
  const manifest = fileURLToPath(
    import.meta.resolve("@stevegreco/design-system-spec/package.json"),
  );
  return join(dirname(manifest), "content");
}

const root = docsRoot();

const slices: ReadonlyMap<string, ComponentSlice> = assembleSlices(
  await loadSpec({ contentDir: specContentDir() }),
  loadImplementations(implementationDir()),
  join(root, "public", "spec-assets"),
);
