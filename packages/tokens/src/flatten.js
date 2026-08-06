// Pure, environment-agnostic token flattening — safe to import in both
// Node (MCP server, Astro docs) and the browser (tokens-explorer via Vite).

export function inferType(value) {
  if (typeof value === "number") return "fontWeight";
  const v = String(value);
  if (/^#[0-9a-f]{3,8}$/i.test(v) || /^(rgb|hsl)a?\(/.test(v)) return "color";
  if (/^-?\d+(\.\d+)?(px|rem|em|%)$/.test(v)) return "dimension";
  if (/^\d+ms$/.test(v)) return "duration";
  if (/^cubic-bezier/.test(v)) return "cubicBezier";
  // shadows: multi-part strings containing px and spaces, or inset keyword
  if (/^inset /.test(v) || (v.includes(" ") && v.includes("px"))) return "shadow";
  // font families: quoted strings or comma-separated lists (not function calls)
  if (v.includes("'") || v.includes('"') || (v.includes(",") && !v.includes("(")))
    return "fontFamily";
  if (/^-?\d+(\.\d+)?$/.test(v)) return "number";
  return "string";
}

// Matches Style Dictionary's css transformGroup, which kebab-cases each
// path segment (e.g. "robRoy" -> "rob-roy", "onAccent" -> "on-accent").
const kebabCase = (segment) => segment.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

export function flatten(obj, parts = []) {
  const tokens = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = [...parts, key];
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      tokens.push(...flatten(val, path));
    } else {
      const root = path[0];
      tokens.push({
        path: path.join("."),
        cssVariable: "--" + path.map(kebabCase).join("-"),
        value: String(val),
        type: inferType(val),
        tier:
          root === "primitives" ? "primitive" : root === "semantic" ? "semantic" : "component",
      });
    }
  }
  return tokens;
}
