import { CSS_PREFIX } from "@stevegreco/design-system/flatten";
import semanticLight from "@stevegreco/design-system/tokens/semantic-light";

export type SemanticReferenceKind =
  | "background"
  | "foreground"
  | "border"
  | "typography"
  | "elevation"
  | "shape"
  | "status-pairings"
  | "example";

interface FlatToken {
  path: string;
  cssVariable: string;
  value: string;
}

export interface ActionReferenceCell {
  kind: "token" | "transparent";
  tokens: FlatToken[];
}

const kebabCase = (segment: string) => segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const flattenTokens = (value: unknown, parts: string[] = []): FlatToken[] => {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) => flattenTokens(child, [...parts, key]));
  }

  return [
    {
      path: parts.join("."),
      cssVariable: `--${CSS_PREFIX}-${parts.map(kebabCase).join("-")}`,
      value: String(value),
    },
  ];
};

const semanticTokens = flattenTokens(semanticLight);
const leafNames = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"];

const titleCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll(".", " · ")
    .replace(/^./, (character) => character.toUpperCase());

export const colorReference = (group: "background" | "foreground" | "border") => {
  const prefix = `semantic.color.${group}.`;
  return semanticTokens
    .filter((token) => token.path.startsWith(prefix))
    .map((token) => ({
      ...token,
      role: titleCase(token.path.slice(prefix.length)),
      segments: token.path.slice(prefix.length).split("."),
    }));
};

type ColorGroup = "background" | "foreground" | "border";

export const groupedColorReference = (group: ColorGroup) => {
  const tokens = colorReference(group);
  const sections = [
    {
      key: "foundation",
      title: "Foundation",
      tokens: tokens
        .filter((token) => token.segments.length === 1)
        .map((token) => ({
          ...token,
          sectionRole: titleCase(token.segments[0]),
        })),
    },
    {
      key: "brand",
      title: "Brand",
      tokens: tokens
        .filter((token) => token.segments[0] === "brand")
        .map((token) => ({
          ...token,
          sectionRole: titleCase(token.segments.slice(1).join(".")),
        })),
    },
    {
      key: "paired",
      title: "Paired content",
      tokens: tokens
        .filter((token) => token.segments[0] === "on")
        .map((token) => ({
          ...token,
          sectionRole: titleCase(token.segments.slice(1).join(".")),
        })),
    },
    {
      key: "status",
      title: "Status",
      tokens: tokens
        .filter((token) => token.segments[0] === "status")
        .map((token) => ({
          ...token,
          sectionRole: titleCase(token.segments[1]),
        })),
    },
  ].filter((section) => section.tokens.length > 0);

  const actionTokens = tokens.filter((token) => token.segments[0] === "action");
  const actionFamilies = [...new Set(actionTokens.map((token) => token.segments[1]))];
  const preferredStates = ["default", "hover", "pressed"];
  const availableStates = [...new Set(actionTokens.map((token) => token.segments[2]))];
  const states = [
    ...preferredStates.filter((state) => availableStates.includes(state)),
    ...availableStates.filter((state) => !preferredStates.includes(state)),
  ];
  const actions = actionFamilies.map((family) => {
    const cells = new Map<string, ActionReferenceCell>(
      actionTokens
        .filter((token) => token.segments[1] === family)
        .map((token) => [token.segments[2], { kind: "token" as const, tokens: [token] }]),
    );
    if (group === "background" && family === "tertiary") {
      cells.set("default", { kind: "transparent", tokens: [] });
    }
    return { family: titleCase(family), cells };
  });

  return { actions, sections, states };
};

export const statusPairingReference = () => {
  const groups = ["background", "foreground", "border"] as const;
  const tokens = new Map(
    groups.map((group) => [
      group,
      colorReference(group).filter((token) => token.segments[0] === "status"),
    ]),
  );
  const intents = [
    ...new Set(groups.flatMap((group) => tokens.get(group)!.map((token) => token.segments[1]))),
  ];

  return intents.map((intent) => ({
    intent: titleCase(intent),
    tokens: new Map(
      groups.map((group) => [
        group,
        tokens.get(group)!.find((token) => token.segments[1] === intent),
      ]),
    ),
  }));
};

export const typographyReference = () => {
  const prefix = "semantic.typography.";
  const recipes = new Map<string, FlatToken[]>();

  for (const token of semanticTokens.filter((item) => item.path.startsWith(prefix))) {
    const recipePath = token.path.split(".").slice(0, -1).join(".");
    const recipe = recipes.get(recipePath) ?? [];
    recipe.push(token);
    recipes.set(recipePath, recipe);
  }

  return [...recipes].map(([path, tokens]) => ({
    label: titleCase(path.slice(prefix.length)),
    path,
    tokens: leafNames.map((leaf) => tokens.find((token) => token.path.endsWith(`.${leaf}`))!),
  }));
};

export const elevationReference = () =>
  semanticTokens
    .filter((token) => token.path.startsWith("semantic.elevation."))
    .map((token) => ({
      ...token,
      role: titleCase(token.path.replace("semantic.elevation.", "")),
    }));

export const shapeReference = () =>
  semanticTokens
    .filter((token) => token.path.startsWith("semantic.radius."))
    .map((token) => ({
      ...token,
      role: titleCase(token.path.replace("semantic.radius.", "")),
    }));

const markdownTable = (headings: string[], rows: string[][]) =>
  [
    `| ${headings.join(" | ")} |`,
    `| ${headings.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");

export const semanticReferenceMarkdown = (kind: SemanticReferenceKind) => {
  if (kind === "background" || kind === "foreground" || kind === "border") {
    const { actions, sections, states } = groupedColorReference(kind);
    const lists = sections.map((section) =>
      [
        `#### ${section.title}`,
        markdownTable(
          ["Role", "CSS variable"],
          section.tokens.map((token) => [token.sectionRole, `\`${token.cssVariable}\``]),
        ),
      ].join("\n\n"),
    );
    const actionReference =
      actions.length > 0
        ? [
            "#### Actions",
            ...actions.map((action) =>
              [
                `##### ${action.family}`,
                ...states.flatMap((state) => {
                  const cell = action.cells.get(state);
                  if (!cell) return [];
                  const value =
                    cell.kind === "transparent"
                      ? "Transparent"
                      : `\`${cell.tokens[0].cssVariable}\``;
                  return `- ${titleCase(state)}: ${value}`;
                }),
              ].join("\n"),
            ),
          ].join("\n\n")
        : "";
    const ordered = [
      lists.find((section) => section.startsWith("#### Foundation")),
      lists.find((section) => section.startsWith("#### Brand")),
      actionReference,
      lists.find((section) => section.startsWith("#### Paired content")),
      lists.find((section) => section.startsWith("#### Status")),
    ];
    return ordered.filter(Boolean).join("\n\n");
  }

  if (kind === "status-pairings") {
    return markdownTable(
      ["Status", "Background", "Foreground", "Border"],
      statusPairingReference().map((row) => [
        row.intent,
        ...(["background", "foreground", "border"] as const).map((group) => {
          const token = row.tokens.get(group);
          return token ? `\`${token.cssVariable}\`` : "—";
        }),
      ]),
    );
  }

  if (kind === "typography") {
    return markdownTable(
      ["Recipe", "CSS variables"],
      typographyReference().map((recipe) => [
        recipe.label,
        recipe.tokens.map((token) => `\`${token.cssVariable}\``).join("<br>"),
      ]),
    );
  }

  if (kind === "elevation") {
    return markdownTable(
      ["Role", "CSS variable"],
      elevationReference().map((token) => [token.role, `\`${token.cssVariable}\``]),
    );
  }

  if (kind === "shape") {
    return markdownTable(
      ["Role", "CSS variable"],
      shapeReference().map((token) => [token.role, `\`${token.cssVariable}\``]),
    );
  }

  return [
    "```css",
    ".card {",
    "  background: var(--ds-semantic-color-background-surface);",
    "  border: 1px solid var(--ds-semantic-color-border-subtle);",
    "  color: var(--ds-semantic-color-foreground-default);",
    "  border-radius: var(--ds-semantic-radius-surface);",
    "  box-shadow: var(--ds-semantic-elevation-sm);",
    "}",
    "```",
  ].join("\n");
};
