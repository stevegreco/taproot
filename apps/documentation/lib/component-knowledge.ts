import { access, cp, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openCatalog } from "@stevegreco/design-system-knowledge/retrieve";

export type ComponentSlug = string;

export type ComponentKnowledgeSection =
  | "intro"
  | "behavior"
  | "variants"
  | "together"
  | "api"
  | "accessibility"
  | "review";

export type ApiMemberKind = "attribute" | "property" | "event";
export type CheckLevel = "error" | "warning";
export type RecordStatus = "draft" | "accepted" | "deprecated" | "superseded";

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

export interface TogetherSection {
  readonly title: string;
  readonly summary: string;
  readonly avoid: readonly string[];
  readonly example: ExampleFigure | undefined;
}

export interface ReviewCheck {
  readonly id: string;
  readonly level: CheckLevel;
  readonly requirement: string;
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
  readonly introMarkdown: string;
  readonly behaviorMarkdown: string;
  readonly variants: readonly Variant[];
  readonly api: readonly ApiRow[];
  readonly accessibility: AccessibilitySection;
  readonly together: TogetherSection | undefined;
  readonly review: ReviewSection | undefined;
}

export type DocsKnowledgeCode =
  | "invalid-slug"
  | "missing-component"
  | "malformed-contract"
  | "unexpected-slice"
  | "unknown-section"
  | "bundle";

export class DocsKnowledgeError extends Error {
  readonly code: DocsKnowledgeCode;

  constructor(code: DocsKnowledgeCode, message: string) {
    super(message);
    this.name = "DocsKnowledgeError";
    this.code = code;
  }
}

type Catalog = Awaited<ReturnType<typeof openCatalog>>;

const SLUG = /^[a-z][a-z0-9-]*$/;
const DIGEST_PREFIX_LENGTH = 12;
const SECTIONS: readonly ComponentKnowledgeSection[] = [
  "intro",
  "behavior",
  "variants",
  "together",
  "api",
  "accessibility",
  "review",
];
const EXAMPLE_LABELS: Record<string, string> = {
  primary: "Save changes",
  secondary: "Cancel",
  ghost: "View details",
  danger: "Delete project",
};

function resolvePublicRoot(): string {
  try {
    const manifestHref = import.meta.resolve("@stevegreco/design-system-knowledge/manifest");
    return dirname(fileURLToPath(manifestHref));
  } catch (error) {
    throw new DocsKnowledgeError("bundle", error instanceof Error ? error.message : String(error));
  }
}

function assetPublicDir(): string {
  return fileURLToPath(new URL("../public/knowledge-assets/", import.meta.url));
}

function digestPrefix(digest: string): string {
  return digest.replace(/^sha256:/, "").slice(0, DIGEST_PREFIX_LENGTH);
}

function assertSlug(slug: string): asserts slug is ComponentSlug {
  if (!SLUG.test(slug)) {
    throw new DocsKnowledgeError(
      "invalid-slug",
      `"${slug}" is not a component page slug. Use "button", not "component.button".`,
    );
  }
}

function fail(code: DocsKnowledgeCode, message: string): never {
  throw new DocsKnowledgeError(code, message);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function loadComponentSlice(slug: string): ComponentSlice {
  assertSlug(slug);
  const slice = slices.get(slug);
  if (!slice) {
    throw new DocsKnowledgeError(
      "missing-component",
      `No public component record for "${slug}". Expected id component.${slug}.`,
    );
  }
  return slice;
}

export function componentKnowledgeMarkdown(slug: string, section?: string): string {
  const slice = loadComponentSlice(slug);
  if (section == null) {
    return SECTIONS.map((name) => renderSectionMarkdown(slice, name))
      .filter((part) => part.length > 0)
      .join("\n\n");
  }
  if (!isSection(section)) {
    throw new DocsKnowledgeError("unknown-section", `"${section}" is not a component page section.`);
  }
  return renderSectionMarkdown(slice, section);
}

function isSection(value: string): value is ComponentKnowledgeSection {
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

function renderSectionMarkdown(slice: ComponentSlice, section: ComponentKnowledgeSection): string {
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
      const parts = [slice.together.summary];
      if (slice.together.example) {
        parts.push(
          `![${slice.together.example.alt}](${slice.together.example.src})`,
          ...slice.together.example.annotations.map(
            (annotation) => `- **${annotation.label}:** ${annotation.description}`,
          ),
        );
      }
      if (slice.together.avoid.length > 0) {
        parts.push("### Avoid", ...slice.together.avoid.map((item) => `- ${item}`));
      }
      return parts.filter((part) => part.length > 0).join("\n\n");
    }
    case "api":
      return markdownTable(
        ["Name", "Type", "Default", "Description"],
        slice.api.map((row) => [
          row.name,
          row.typeDisplay,
          row.defaultDisplay ?? "",
          apiDescription(row),
        ]),
      );
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
      return slice.review.checks.map((check) => `- ${check.requirement}`).join("\n");
  }
}

async function stageAssets(publicRoot: string, digest: string): Promise<void> {
  const from = join(publicRoot, "assets");
  try {
    await access(from);
  } catch {
    return;
  }

  const to = join(assetPublicDir(), digestPrefix(digest));
  await mkdir(to, { recursive: true });
  const entries = await readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    await cp(join(from, entry.name), join(to, entry.name), { recursive: true });
  }
}

function docsHref(recordId: string): string {
  const dot = recordId.indexOf(".");
  const type = dot === -1 ? recordId : recordId.slice(0, dot);
  const rest = dot === -1 ? recordId : recordId.slice(dot + 1);
  if (type === "component") return `/components/${rest}`;
  if (type === "pattern") return "#using-together";
  if (type === "example") return "#using-together";
  if (type === "guideline") return "#review-checklist";
  return `#${rest}`;
}

function rewriteBundleUrls(markdown: string, digest: string): string {
  const assetsRoot = `/knowledge-assets/${digestPrefix(digest)}`;
  return markdown
    .replace(/\]\(assets\/([^)]+)\)/g, (_match, file: string) => `](${assetsRoot}/${file})`)
    .replace(/\]\(markdown\/([^)]+?)\.md(?:#[^)]*)?\)/g, (_match, id: string) => `](${docsHref(id)})`);
}

function exampleLabel(variant: string): string {
  return EXAMPLE_LABELS[variant] ?? "Action";
}

function exampleHtml(tagName: string, variant: string): string {
  return `<${tagName} variant="${variant}">${exampleLabel(variant)}</${tagName}>`;
}

function markdownByHeading(body: string): { preamble: string; sections: Map<string, string> } {
  const matches = [...body.matchAll(/^##\s+(.+)$/gm)];
  if (matches.length === 0) {
    return { preamble: body.trim(), sections: new Map() };
  }
  const preamble = body.slice(0, matches[0]?.index ?? 0).trim();
  const sections = new Map<string, string>();
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const heading = match[1]?.trim().toLowerCase();
    if (!heading) continue;
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? body.length) : body.length;
    sections.set(heading, body.slice(start, end).trim());
  }
  return { preamble, sections };
}

function patternGuidanceByVariant(body: string): Map<string, string> {
  const guidance = new Map<string, string>();
  const matches = [...body.matchAll(/^###\s+(.+)$/gm)];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const heading = match[1]?.trim().toLowerCase();
    if (!heading) continue;
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? body.length) : body.length;
    let text = body.slice(start, end).trim();
    const cut = text.search(/^##\s+/m);
    if (cut !== -1) text = text.slice(0, cut).trim();
    guidance.set(heading, text);
  }
  return guidance;
}

function bulletItems(markdown: string): string[] {
  return markdown.split("\n").flatMap((line) => {
    const match = line.match(/^[-*]\s+(.*)$/);
    return match?.[1] ? [match[1]] : [];
  });
}

function enumTypeDisplay(values: Record<string, unknown>): string {
  return Object.keys(values)
    .map((key) => `"${key}"`)
    .join(" | ");
}

function projectValues(spec: Record<string, unknown>): ApiValue[] {
  if (!isObject(spec.values)) return [];
  return Object.entries(spec.values).flatMap(([name, description]) =>
    typeof description === "string" ? [{ name, description }] : [],
  );
}

function defaultDisplay(spec: Record<string, unknown>): string | undefined {
  if (!Object.hasOwn(spec, "default") || spec.default === undefined) return undefined;
  if (typeof spec.default === "string") return spec.default;
  return JSON.stringify(spec.default);
}

function typeDisplay(spec: Record<string, unknown>, kind: ApiMemberKind): string {
  const valueType = typeof spec.kind === "string" ? spec.kind : spec.type;
  if (valueType === "enum" && isObject(spec.values)) return enumTypeDisplay(spec.values);
  if (typeof valueType === "string" && valueType.length > 0) return valueType;
  return kind === "event" ? "event" : "";
}

function projectMembers(source: unknown, kind: ApiMemberKind): ApiRow[] {
  if (!isObject(source)) return [];
  return Object.entries(source).map(([name, spec]) => {
    const fields = isObject(spec) ? spec : {};
    const values = projectValues(fields);
    return {
      name,
      kind,
      typeDisplay: typeDisplay(fields, kind),
      defaultDisplay: defaultDisplay(fields),
      description: asString(fields.description),
      values,
    };
  });
}

function hostValueMap(mapped: Record<string, unknown>): Record<string, unknown> | undefined {
  return isObject(mapped.values) ? mapped.values : undefined;
}

function remapValues(fields: Record<string, unknown>, valueMap: Record<string, unknown> | undefined): ApiValue[] {
  const original = projectValues(fields);
  if (!valueMap) return original;
  return original.map((item) => ({
    ...item,
    name: asString(valueMap[item.name], item.name),
  }));
}

function remapDefault(
  fields: Record<string, unknown>,
  valueMap: Record<string, unknown> | undefined,
): string | undefined {
  const raw = defaultDisplay(fields);
  if (raw == null || !valueMap) return raw;
  return asString(valueMap[raw], raw);
}

function projectApi(contract: Record<string, unknown>, host: Record<string, unknown>): ApiRow[] {
  const parameters = isObject(contract.parameters) ? contract.parameters : {};
  const hostParameters = isObject(host.parameters) ? host.parameters : {};
  const attributes = Object.entries(parameters).map(([portableName, spec]) => {
    const fields = isObject(spec) ? spec : {};
    const mapped = isObject(hostParameters[portableName]) ? hostParameters[portableName] : {};
    const valueMap = hostValueMap(mapped);
    const values = remapValues(fields, valueMap);
    const displayed = Object.fromEntries(values.map((item) => [item.name, item.description]));
    return {
      name: asString(mapped.attribute, portableName),
      kind: "attribute" as const,
      typeDisplay: typeDisplay({ ...fields, values: displayed }, "attribute"),
      defaultDisplay: remapDefault(fields, valueMap),
      description: asString(fields.description),
      values,
    };
  });
  const portableEvents = isObject(contract.events) ? contract.events : {};
  const hostEvents = isObject(host.events) ? host.events : {};
  const events = Object.entries(hostEvents).map(([portableName, spec]) => {
    const fields = isObject(spec) ? spec : {};
    const portable = isObject(portableEvents[portableName]) ? portableEvents[portableName] : {};
    return {
      name: asString(fields.event, portableName),
      kind: "event" as const,
      typeDisplay: "event",
      defaultDisplay: undefined,
      description: asString(portable.description, asString(fields.description)),
      values: [],
    };
  });
  return [...attributes, ...projectMembers(host.properties, "property"), ...events];
}

function bindingHost(catalog: Catalog, id: string): Record<string, unknown> {
  const bindings = catalog.related(id).flatMap((neighbor) => {
    const related = neighbor.record;
    if (!isObject(related) || related.type !== "binding" || !isObject(related.host)) return [];
    return [related.host];
  });
  const web = bindings.find((host) => host.platform === "web-component");
  const host = web ?? bindings[0];
  if (!host) fail("malformed-contract", `${id} has no host binding`);
  return host;
}

function projectVariants(
  tagName: string,
  parameters: Record<string, unknown>,
  guidance: Map<string, string>,
): Variant[] {
  const variant = parameters.variant;
  if (!isObject(variant) || !isObject(variant.values) || Object.keys(variant.values).length === 0) {
    fail("malformed-contract", "component contract is missing parameters.variant values");
  }
  const defaultName = asString(variant.default);
  return Object.entries(variant.values).map(([name, description]) => ({
    name,
    description: asString(description),
    guidance: guidance.get(name) ?? "",
    isDefault: name === defaultName,
    exampleHtml: exampleHtml(tagName, name),
    exampleLabel: exampleLabel(name),
  }));
}

function projectAccessibility(value: unknown, id: string): AccessibilitySection {
  if (!isObject(value)) {
    fail("malformed-contract", `${id} contract is missing accessibility`);
  }
  const keyboard = Array.isArray(value.keyboard)
    ? value.keyboard.flatMap((item) => {
        if (!isObject(item)) return [];
        return [{ key: asString(item.key), action: asString(item.action) }];
      })
    : [];
  const requirements = Array.isArray(value.requirements)
    ? value.requirements.filter((item): item is string => typeof item === "string")
    : [];
  return { keyboard, requirements };
}

function projectExample(record: Record<string, unknown>, digest: string): ExampleFigure {
  const assets = Array.isArray(record.assets) ? record.assets : [];
  const asset = assets[0];
  if (!isObject(asset)) {
    fail("malformed-contract", `${asString(record.id)} example is missing assets`);
  }
  const bundlePath = asString(asset.bundlePath);
  const file = bundlePath.replace(/^assets\//, "");
  const annotations = Array.isArray(record.annotations)
    ? record.annotations.flatMap((item) => {
        if (!isObject(item)) return [];
        return [{ label: asString(item.label), description: asString(item.description) }];
      })
    : [];
  return {
    title: asString(record.title),
    summary: asString(record.summary),
    src: `/knowledge-assets/${digestPrefix(digest)}/${file}`,
    alt: asString(asset.alt),
    width: typeof asset.width === "number" ? asset.width : 0,
    height: typeof asset.height === "number" ? asset.height : 0,
    annotations,
  };
}

function projectReview(record: Record<string, unknown>): ReviewSection {
  const checks = Array.isArray(record.checks) ? record.checks : [];
  return {
    title: asString(record.title),
    checks: checks.flatMap((item) => {
      if (!isObject(item)) return [];
      const level = item.level;
      if (level !== "error" && level !== "warning") return [];
      return [
        {
          id: asString(item.id),
          level,
          requirement: asString(item.requirement),
        },
      ];
    }),
  };
}

function projectIntro(body: string, digest: string): { introMarkdown: string; behaviorMarkdown: string } {
  const { preamble, sections } = markdownByHeading(rewriteBundleUrls(body, digest));
  const label = sections.get("write the label");
  const behavior = sections.get("preserve native behavior");
  return {
    introMarkdown: preamble,
    behaviorMarkdown: [
      label ? `### Write the label\n\n${label}` : "",
      behavior ? `### Forms\n\n${behavior}` : "",
    ]
      .filter((part) => part.length > 0)
      .join("\n\n"),
  };
}

function projectComponent(catalog: Catalog, record: unknown, digest: string): ComponentSlice {
  if (!isObject(record)) fail("malformed-contract", "component record must be an object");
  const id = asString(record.id);
  if (!id.startsWith("component.")) {
    fail("malformed-contract", `${id || "<missing id>"} is not a component record`);
  }
  const slug = id.slice("component.".length);
  if (!SLUG.test(slug)) {
    fail("malformed-contract", `${id} does not map to a page slug`);
  }
  if (!isObject(record.contract)) {
    fail("malformed-contract", `${id} is missing a contract`);
  }
  const host = bindingHost(catalog, id);
  const tagName = asString(host.defaultTagName);
  if (!tagName) fail("malformed-contract", `${id} binding is missing defaultTagName`);
  const parameters = record.contract.parameters;
  if (!isObject(parameters)) {
    fail("malformed-contract", `${id} contract is missing parameters`);
  }

  const status = record.status;
  if (status !== "draft" && status !== "accepted" && status !== "deprecated" && status !== "superseded") {
    fail("malformed-contract", `${id} has an unknown status`);
  }

  let patternTitle = "";
  let patternSummary = "";
  let patternBody = "";
  let example: ExampleFigure | undefined;
  let review: ReviewSection | undefined;

  for (const neighbor of catalog.related(id)) {
    const related = neighbor.record;
    if (!isObject(related)) continue;
    const type = related.type;
    if (type === "pattern") {
      if (patternTitle) fail("unexpected-slice", `${id} has more than one related pattern`);
      patternTitle = asString(related.title);
      patternSummary = asString(related.summary);
      patternBody = asString(related.body);
    } else if (type === "example") {
      if (example) fail("unexpected-slice", `${id} has more than one related example`);
      example = projectExample(related, digest);
    } else if (type === "guideline") {
      const checks = related.checks;
      if (!Array.isArray(checks) || checks.length === 0) continue;
      if (review) fail("unexpected-slice", `${id} has more than one related review guideline`);
      review = projectReview(related);
    }
  }

  const variants = projectVariants(tagName, parameters, patternGuidanceByVariant(patternBody));
  const { introMarkdown, behaviorMarkdown } = projectIntro(asString(record.body), digest);
  const avoid = bulletItems(markdownByHeading(patternBody).sections.get("avoid") ?? "");

  const together =
    patternTitle || example
      ? {
          title: patternTitle,
          summary: patternSummary,
          avoid,
          example,
        }
      : undefined;

  return {
    slug,
    title: asString(record.title),
    summary: asString(record.summary),
    status: status as RecordStatus,
    tagName,
    introMarkdown,
    behaviorMarkdown,
    variants,
    api: projectApi(record.contract, host),
    accessibility: projectAccessibility(record.contract.accessibility, id),
    together,
    review,
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

async function assembleDocsKnowledge(): Promise<ReadonlyMap<string, ComponentSlice>> {
  const publicRoot = resolvePublicRoot();
  let catalog: Catalog;
  try {
    catalog = await openCatalog(publicRoot, { expectVisibility: "public" });
  } catch (error) {
    if (error instanceof DocsKnowledgeError) throw error;
    throw new DocsKnowledgeError("bundle", error instanceof Error ? error.message : String(error));
  }

  try {
    await stageAssets(publicRoot, catalog.info.digest);
  } catch (error) {
    throw new DocsKnowledgeError("bundle", error instanceof Error ? error.message : String(error));
  }

  const map = new Map<string, ComponentSlice>();
  for (const record of catalog.list({ type: "component" })) {
    const slice = deepFreeze(projectComponent(catalog, record, catalog.info.digest));
    map.set(slice.slug, slice);
  }
  return Object.freeze(map);
}

const slices: ReadonlyMap<string, ComponentSlice> = await assembleDocsKnowledge();
