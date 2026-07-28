// Color math shared by the token audits. sRGB in, D65 out.

function channel(v) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function rgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

// Relative luminance, WCAG 2.1 / CIE Y.
export function luminance(hex) {
  const [r, g, b] = rgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// WCAG 2.1 contrast ratio. Order-independent.
export function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// CIE L* — perceptual lightness, 0 (black) to 100 (white). A pure function of
// luminance, so it costs nothing on top of the contrast math.
export function lstar(hex) {
  const y = luminance(hex);
  return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y;
}

export function isHex(v) {
  return typeof v === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
}

// Depth-first walk yielding [dottedPath, value] for every leaf string.
export function* leaves(node, path = []) {
  if (typeof node !== "object" || node === null) {
    yield [path.join("."), node];
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    yield* leaves(child, [...path, key]);
  }
}
