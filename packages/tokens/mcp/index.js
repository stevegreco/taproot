#!/usr/bin/env node
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, statSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Maps CSS properties to the token type and path hints used for scoring.
// hints are substrings matched against token paths (case-insensitive).
const CSS_PROPERTY_MAP = {
  "background-color":          { type: "color",       hints: ["bg", "background"] },
  "background":                { type: "color",       hints: ["bg", "background"] },
  "color":                     { type: "color",       hints: ["fg", "foreground"] },
  "border-color":              { type: "color",       hints: ["border"] },
  "outline-color":             { type: "color",       hints: ["border", "focus"] },
  "fill":                      { type: "color",       hints: ["fg", "foreground"] },
  "stroke":                    { type: "color",       hints: ["border", "fg"] },
  "caret-color":               { type: "color",       hints: ["fg", "accent"] },
  "border-radius":             { type: "dimension",   hints: ["radius"] },
  "border-width":              { type: "dimension",   hints: ["border"] },
  "padding":                   { type: "dimension",   hints: ["padding"] },
  "padding-top":               { type: "dimension",   hints: ["paddingY", "padding"] },
  "padding-bottom":            { type: "dimension",   hints: ["paddingY", "padding"] },
  "padding-left":              { type: "dimension",   hints: ["paddingX", "padding"] },
  "padding-right":             { type: "dimension",   hints: ["paddingX", "padding"] },
  "gap":                       { type: "dimension",   hints: ["gap", "space"] },
  "margin":                    { type: "dimension",   hints: ["space"] },
  "font-size":                 { type: "dimension",   hints: ["fontSize", "text"] },
  "letter-spacing":            { type: "dimension",   hints: ["tracking"] },
  "line-height":               { type: "number",      hints: ["leading"] },
  "font-family":               { type: "fontFamily",  hints: ["fontFamily", "font"] },
  "font-weight":               { type: "fontWeight",  hints: ["fontWeight", "weight"] },
  "box-shadow":                { type: "shadow",      hints: ["shadow"] },
  "transition-duration":       { type: "duration",    hints: ["duration", "transition"] },
  "animation-duration":        { type: "duration",    hints: ["duration"] },
  "transition-timing-function":{ type: "cubicBezier", hints: ["ease"] },
  "width":                     { type: "dimension",   hints: ["layout", "space"] },
  "max-width":                 { type: "dimension",   hints: ["layout"] },
};

const TIER_BONUS = { component: 0.3, semantic: 0.2, primitive: 0.1 };

const DIST = {
  primitives: join(ROOT, "dist/tokens/primitives.json"),
  semanticLight: join(ROOT, "dist/tokens/semantic.light.json"),
  semanticDark: join(ROOT, "dist/tokens/semantic.dark.json"),
  components: join(ROOT, "dist/tokens/components.json"),
};

function sourceFiles() {
  const base = [
    join(ROOT, "tokens/primitives.tokens.json"),
    join(ROOT, "tokens/semantic/light.tokens.json"),
    join(ROOT, "tokens/semantic/dark.tokens.json"),
  ];
  try {
    const components = readdirSync(join(ROOT, "tokens/components"))
      .filter((f) => f.endsWith(".tokens.json"))
      .map((f) => join(ROOT, "tokens/components", f));
    return [...base, ...components];
  } catch {
    return base;
  }
}

function isStale() {
  try {
    const srcMax = Math.max(
      ...sourceFiles().map((f) => {
        try { return statSync(f).mtimeMs; } catch { return 0; }
      })
    );
    const distMin = Math.min(
      ...Object.values(DIST).map((f) => {
        try { return statSync(f).mtimeMs; } catch { return 0; }
      })
    );
    return srcMax > distMin;
  } catch {
    return false;
  }
}

function inferType(value) {
  if (typeof value === "number") return "fontWeight";
  const v = String(value);
  if (/^#[0-9a-f]{3,8}$/i.test(v) || /^(rgb|hsl)a?\(/.test(v)) return "color";
  if (/^-?\d+(\.\d+)?(px|rem|em|%)$/.test(v)) return "dimension";
  if (/^\d+ms$/.test(v)) return "duration";
  if (/^cubic-bezier/.test(v)) return "cubicBezier";
  // shadows: multi-part strings containing px and spaces, or inset keyword
  if (/^inset /.test(v) || (v.includes(" ") && v.includes("px"))) return "shadow";
  // font families: quoted strings or comma-separated lists (not function calls)
  if (v.includes("'") || v.includes('"') || (v.includes(",") && !v.includes("("))) return "fontFamily";
  if (/^-?\d+(\.\d+)?$/.test(v)) return "number";
  return "string";
}

function flatten(obj, parts = []) {
  const tokens = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = [...parts, key];
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      tokens.push(...flatten(val, path));
    } else {
      const root = path[0];
      tokens.push({
        path: path.join("."),
        cssVariable: "--" + path.join("-"),
        value: String(val),
        type: inferType(val),
        tier:
          root === "primitives" ? "primitive"
          : root === "semantic" ? "semantic"
          : "component",
      });
    }
  }
  return tokens;
}

function loadTokens(theme = "light") {
  const semanticFile = theme === "dark" ? DIST.semanticDark : DIST.semanticLight;
  const tokens = [];
  for (const file of [DIST.primitives, semanticFile, DIST.components]) {
    try {
      tokens.push(...flatten(JSON.parse(readFileSync(file, "utf-8"))));
    } catch {
      // dist not yet built
    }
  }
  return tokens;
}

const server = new McpServer({
  name: "design-system-tokens",
  version: "1.0.0",
});

server.registerTool(
  "search_tokens",
  {
    description:
      "Search design tokens by keyword. Matches against token paths and resolved values. " +
      "Returns path, CSS variable name, resolved value, type, and tier for each result.",
    inputSchema: z.object({
      query: z.string().describe(
        "Substring to search for in token paths and resolved values (e.g. 'danger', 'border', '#b8472a')"
      ),
      tier: z
        .enum(["primitive", "semantic", "component"])
        .optional()
        .describe("Restrict results to a single tier"),
      type: z
        .string()
        .optional()
        .describe("Restrict results to a token type (e.g. color, dimension, fontFamily, duration)"),
      theme: z
        .enum(["light", "dark"])
        .optional()
        .describe("Theme variant for semantic tokens. Defaults to light."),
    }),
  },
  async ({ query, tier, type, theme = "light" }) => {
    const tokens = loadTokens(theme);
    const q = query.toLowerCase();

    let results = tokens.filter(
      (t) => t.path.toLowerCase().includes(q) || t.value.toLowerCase().includes(q)
    );
    if (tier) results = results.filter((t) => t.tier === tier);
    if (type) results = results.filter((t) => t.type === type);

    const stale = isStale() ? "\n\n⚠ Token files may be out of date — run pnpm build" : "";

    if (results.length === 0) {
      return {
        content: [{ type: "text", text: `No tokens found matching "${query}".${stale}` }],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) + stale }],
    };
  }
);

server.registerTool(
  "get_token",
  {
    description:
      "Get a single design token by its exact dot-separated path. " +
      "Returns path, CSS variable name, resolved value, type, and tier.",
    inputSchema: z.object({
      path: z
        .string()
        .describe("Exact token path (e.g. component.button.primary.bg)"),
      theme: z
        .enum(["light", "dark"])
        .optional()
        .describe("Theme variant for semantic tokens. Defaults to light."),
    }),
  },
  async ({ path, theme = "light" }) => {
    const tokens = loadTokens(theme);
    const token = tokens.find((t) => t.path === path);
    const stale = isStale() ? "\n\n⚠ Token files may be out of date — run pnpm build" : "";

    if (!token) {
      return {
        content: [{ type: "text", text: `Token not found: "${path}".${stale}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(token, null, 2) + stale }],
    };
  }
);

server.registerTool(
  "suggest_token",
  {
    description:
      "Suggest the best design token for a given CSS property and usage context. " +
      "Returns up to 5 ranked suggestions, preferring component tokens over semantic and semantic over primitive.",
    inputSchema: z.object({
      property: z.string().describe(
        "CSS property name (e.g. 'background-color', 'border-radius', 'font-size', 'box-shadow')"
      ),
      context: z.string().optional().describe(
        "Plain-English usage context to narrow results (e.g. 'danger button', 'input focus state', 'card background')"
      ),
      theme: z.enum(["light", "dark"]).optional().describe(
        "Theme variant for semantic tokens. Defaults to light."
      ),
    }),
  },
  async ({ property, context = "", theme = "light" }) => {
    const tokens = loadTokens(theme);
    const stale = isStale() ? "\n\n⚠ Token files may be out of date — run pnpm build" : "";
    const hint = CSS_PROPERTY_MAP[property.toLowerCase()];
    const contextKeywords = context.toLowerCase().split(/\W+/).filter(Boolean);

    const scored = tokens
      .map((token) => {
        const pathLower = token.path.toLowerCase();
        let score = 0;

        // Hard filter by token type when the CSS property has a known mapping
        if (hint?.type && token.type !== hint.type) return null;

        // Score by how well the path matches the CSS property's expected path hints
        for (const h of hint?.hints ?? []) {
          if (pathLower.includes(h.toLowerCase())) score += 2;
        }

        // Score by context keyword overlap
        for (const kw of contextKeywords) {
          if (pathLower.includes(kw)) score += 1;
        }

        // If unknown CSS property, fall back to matching the property name itself
        if (!hint) {
          const propKeywords = property.toLowerCase().split(/[-\s]+/);
          for (const kw of propKeywords) {
            if (pathLower.includes(kw)) score += 1;
          }
        }

        if (score === 0) return null;

        return { score: score + TIER_BONUS[token.tier], token };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ token }) => token);

    if (scored.length === 0) {
      const msg = hint
        ? `No tokens found for "${property}"${context ? ` in context "${context}"` : ""}.`
        : `Unknown CSS property "${property}". Try a standard property like "background-color", "border-radius", or "font-size".`;
      return { content: [{ type: "text", text: msg + stale }] };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(scored, null, 2) + stale }],
    };
  }
);

// --- Resources ---

server.registerResource(
  "primitives",
  "tokens://primitives",
  {
    title: "Primitive Tokens",
    description: "Raw scale-based values: colors, spacing, typography, radius, shadow, motion.",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [{ uri: uri.href, text: readFileSync(DIST.primitives, "utf-8") }],
  })
);

server.registerResource(
  "components",
  "tokens://components",
  {
    title: "Component Tokens",
    description: "Component-scoped tokens for button, input, card, badge, and alert.",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [{ uri: uri.href, text: readFileSync(DIST.components, "utf-8") }],
  })
);

server.registerResource(
  "semantic",
  new ResourceTemplate("tokens://semantic/{theme}", {
    list: async () => ({
      resources: [
        { uri: "tokens://semantic/light", name: "Semantic Tokens — Light" },
        { uri: "tokens://semantic/dark", name: "Semantic Tokens — Dark" },
      ],
    }),
  }),
  {
    title: "Semantic Tokens",
    description: "Intent-named tokens for background, foreground, border, accent, and status. Pass 'light' or 'dark'.",
    mimeType: "application/json",
  },
  async (uri, { theme }) => {
    const file = theme === "dark" ? DIST.semanticDark : DIST.semanticLight;
    return { contents: [{ uri: uri.href, text: readFileSync(file, "utf-8") }] };
  }
);

// --- Prompts ---

server.registerPrompt(
  "find-token",
  {
    title: "Find a Token",
    description: "Describe what you need in plain English and get a suggestion for the right design token to use.",
    argsSchema: {
      description: z.string().describe(
        "Plain-English description of what you need (e.g. 'a background color for a danger alert')"
      ),
    },
  },
  ({ description }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text:
            `I need a design token for: "${description}"\n\n` +
            `Use the search_tokens tool to find the best match. ` +
            `Prefer semantic or component tokens over primitives. ` +
            `Reply with the token path, its CSS variable name, and the resolved value.`,
        },
      },
    ],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
