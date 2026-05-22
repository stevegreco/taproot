import { readFile, writeFile } from "node:fs/promises";

const sourceCssPath = "dist/css/tokens.css";
const outputHtmlPath = "examples/token-showcase.html";

const css = await readFile(sourceCssPath, "utf8");
const tokenRegex = /^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gim;

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const collectTokensFromBlock = (selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRegex = new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`, "gm");
  const tokens = [];

  let blockMatch;
  while ((blockMatch = blockRegex.exec(css)) !== null) {
    let tokenMatch;
    while ((tokenMatch = tokenRegex.exec(blockMatch[1])) !== null) {
      tokens.push({
        name: tokenMatch[1],
        value: tokenMatch[2].trim()
      });
    }
    tokenRegex.lastIndex = 0;
  }
  return tokens;
};

const rootTokens = collectTokensFromBlock(":root");
const darkTokens = collectTokensFromBlock(':root[data-theme="dark"]');

const filterPrefix = (tokens, prefix) => tokens.filter((t) => t.name.startsWith(prefix));

const primitivesColor = filterPrefix(rootTokens, "--primitives-color-");
const primitivesText = filterPrefix(rootTokens, "--primitives-text-");
const primitivesFont = filterPrefix(rootTokens, "--primitives-font-");
const primitivesSpace = filterPrefix(rootTokens, "--primitives-space-");
const primitivesRadius = filterPrefix(rootTokens, "--primitives-radius-");
const primitivesShadow = filterPrefix(rootTokens, "--primitives-shadow-");
const semanticLight = filterPrefix(rootTokens, "--semantic-color-");
const semanticDark = filterPrefix(darkTokens, "--semantic-color-");

const groupPrimitiveColorsByScale = (items) => {
  const groups = new Map();

  for (const item of items) {
    const rawName = item.name.replace("--primitives-color-", "");
    const match = rawName.match(/^(.*)-(\d+)$/);
    const scale = match ? match[1] : rawName;
    const step = match ? Number(match[2]) : -1;
    const swatchLabel = match ? match[2] : rawName;

    if (!groups.has(scale)) groups.set(scale, []);
    groups.get(scale).push({ ...item, step, swatchLabel });
  }

  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([scale, values]) => ({
      scale,
      values: values.sort((a, b) => a.step - b.step)
    }));
};

const primitiveColorScales = groupPrimitiveColorsByScale(primitivesColor);

const renderColorCards = (items) =>
  items
    .map(
      (item) => `<article class="token-card">
  <div class="color-swatch" style="background:${escapeHtml(item.value)};"></div>
  <div class="token-meta">
    <code class="token-name">${escapeHtml(item.name)}</code>
    <code class="token-value">${escapeHtml(item.value)}</code>
  </div>
</article>`
    )
    .join("\n");

const renderPrimitiveColorScaleRows = (scales) =>
  scales
    .map(
      (scaleGroup) => `<article class="scale-row">
  <div class="scale-title">
    <h3>${escapeHtml(scaleGroup.scale)}</h3>
  </div>
  <div class="scale-swatches">
    ${scaleGroup.values
      .map(
        (entry) => `<div class="scale-swatch-wrap">
      <div class="scale-swatch" style="background:${escapeHtml(entry.value)};" title="${escapeHtml(
          entry.name
        )}: ${escapeHtml(entry.value)}"></div>
      <code class="scale-step">${escapeHtml(entry.swatchLabel)}</code>
    </div>`
      )
      .join("\n")}
  </div>
</article>`
    )
    .join("\n");

const renderTypographyCards = (items) =>
  items
    .map((item) => {
      const sizeVar = item.name;
      return `<article class="token-card">
  <p class="type-sample" style="font-size: var(${escapeHtml(sizeVar)}); font-family: var(--primitives-font-sans);">
    The quick brown fox jumps over the lazy dog
  </p>
  <div class="token-meta">
    <code class="token-name">${escapeHtml(item.name)}</code>
    <code class="token-value">${escapeHtml(item.value)}</code>
  </div>
</article>`;
    })
    .join("\n");

const renderSpacingCards = (items) =>
  items
    .map(
      (item) => `<article class="token-card">
  <div class="space-row">
    <div class="space-bar" style="width:max(8px, min(260px, calc(${escapeHtml(item.value)} * 14)));"></div>
  </div>
  <div class="token-meta">
    <code class="token-name">${escapeHtml(item.name)}</code>
    <code class="token-value">${escapeHtml(item.value)}</code>
  </div>
</article>`
    )
    .join("\n");

const renderRadiusCards = (items) =>
  items
    .map(
      (item) => `<article class="token-card">
  <div class="radius-box" style="border-radius:${escapeHtml(item.value)};"></div>
  <div class="token-meta">
    <code class="token-name">${escapeHtml(item.name)}</code>
    <code class="token-value">${escapeHtml(item.value)}</code>
  </div>
</article>`
    )
    .join("\n");

const renderShadowCards = (items) =>
  items
    .map(
      (item) => `<article class="token-card">
  <div class="shadow-box" style="box-shadow:${escapeHtml(item.value)};"></div>
  <div class="token-meta">
    <code class="token-name">${escapeHtml(item.name)}</code>
    <code class="token-value">${escapeHtml(item.value)}</code>
  </div>
</article>`
    )
    .join("\n");

const renderFontCards = (items) =>
  items
    .map(
      (item) => `<article class="token-card">
  <p class="font-sample" style="font-family:${escapeHtml(item.value)};">Aa Bb Cc 123</p>
  <div class="token-meta">
    <code class="token-name">${escapeHtml(item.name)}</code>
    <code class="token-value">${escapeHtml(item.value)}</code>
  </div>
</article>`
    )
    .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Design Token Showcase</title>
  <link rel="stylesheet" href="../dist/css/tokens.css" />
  <style>
    :root {
      color-scheme: light dark;
      --ui-bg: #0f172a;
      --ui-bg-soft: #111827;
      --ui-card: #1f2937;
      --ui-text: #f8fafc;
      --ui-muted: #94a3b8;
      --ui-border: #334155;
    }
    :root:not([data-theme="dark"]) {
      --ui-bg: #f8fafc;
      --ui-bg-soft: #eef2f7;
      --ui-card: #ffffff;
      --ui-text: #0f172a;
      --ui-muted: #475569;
      --ui-border: #dbe5ef;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px;
      background: radial-gradient(1200px 400px at 20% -10%, #1e293b 0%, var(--ui-bg) 45%);
      color: var(--ui-text);
      font-family: ui-sans-serif, system-ui, sans-serif;
      line-height: 1.45;
    }
    .wrap { max-width: 1200px; margin: 0 auto; }
    .hero {
      background: linear-gradient(135deg, var(--ui-card), var(--ui-bg-soft));
      border: 1px solid var(--ui-border);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }
    h1 { margin: 0; font-size: 1.8rem; }
    .muted { color: var(--ui-muted); margin: 6px 0 0; }
    .controls { display: flex; gap: 8px; }
    button {
      border: 1px solid var(--ui-border);
      background: var(--ui-card);
      color: var(--ui-text);
      border-radius: 10px;
      padding: 8px 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .semantic-banner {
      background: var(--semantic-color-background-brand);
      border-radius: 14px;
      padding: 14px 16px;
      color: #fff;
      margin-bottom: 20px;
    }
    section { margin-bottom: 24px; }
    h2 { margin: 0 0 10px; font-size: 1.2rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 12px;
    }
    .scale-list {
      display: grid;
      gap: 12px;
    }
    .scale-row {
      background: var(--ui-card);
      border: 1px solid var(--ui-border);
      border-radius: 12px;
      padding: 12px;
      display: grid;
      gap: 10px;
    }
    .scale-title h3 {
      margin: 0;
      font-size: 0.95rem;
      text-transform: capitalize;
      letter-spacing: 0.02em;
    }
    .scale-swatches {
      display: flex;
      gap: 10px;
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .scale-swatch-wrap {
      display: grid;
      gap: 6px;
      justify-items: center;
      min-width: 46px;
    }
    .scale-swatch {
      width: 46px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
    }
    .scale-step {
      font-size: 0.7rem;
      color: var(--ui-muted);
    }
    .token-card {
      background: var(--ui-card);
      border: 1px solid var(--ui-border);
      border-radius: 12px;
      padding: 10px;
      min-height: 88px;
    }
    .token-meta { margin-top: 8px; display: grid; gap: 4px; }
    .token-name, .token-value {
      font-size: 0.75rem;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--ui-muted);
    }
    .color-swatch {
      height: 58px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .type-sample { margin: 0; }
    .space-row { height: 32px; display: flex; align-items: center; }
    .space-bar {
      height: 12px;
      border-radius: 999px;
      background: linear-gradient(90deg, #38bdf8, #6366f1);
    }
    .radius-box {
      height: 56px;
      border: 1px solid var(--ui-border);
      background: linear-gradient(135deg, #34d399, #10b981);
    }
    .shadow-box {
      height: 56px;
      border-radius: 10px;
      background: #fff;
      border: 1px solid #e5e7eb;
    }
    .font-sample { margin: 0; font-size: 1.45rem; }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <div>
        <h1>Design Token Showcase</h1>
        <p class="muted">Generated from dist/css/tokens.css</p>
      </div>
      <div class="controls">
        <button id="lightBtn" type="button">Light</button>
        <button id="darkBtn" type="button">Dark</button>
      </div>
    </header>

    <p class="semantic-banner">
      Semantic background preview using <code>--semantic-color-background-brand</code>
    </p>

    <section>
      <h2>Semantic Colors (Light)</h2>
      <div class="grid">${renderColorCards(semanticLight)}</div>
    </section>

    <section>
      <h2>Semantic Colors (Dark)</h2>
      <div class="grid">${renderColorCards(semanticDark)}</div>
    </section>

    <section>
      <h2>Primitive Colors</h2>
      <div class="scale-list">${renderPrimitiveColorScaleRows(primitiveColorScales)}</div>
    </section>

    <section>
      <h2>Typography Scale</h2>
      <div class="grid">${renderTypographyCards(primitivesText)}</div>
    </section>

    <section>
      <h2>Font Families</h2>
      <div class="grid">${renderFontCards(primitivesFont)}</div>
    </section>

    <section>
      <h2>Spacing Scale</h2>
      <div class="grid">${renderSpacingCards(primitivesSpace)}</div>
    </section>

    <section>
      <h2>Radius</h2>
      <div class="grid">${renderRadiusCards(primitivesRadius)}</div>
    </section>

    <section>
      <h2>Shadows</h2>
      <div class="grid">${renderShadowCards(primitivesShadow)}</div>
    </section>
  </div>

  <script>
    const root = document.documentElement;
    document.getElementById("lightBtn").addEventListener("click", () => root.removeAttribute("data-theme"));
    document.getElementById("darkBtn").addEventListener("click", () => root.setAttribute("data-theme", "dark"));
  </script>
</body>
</html>
`;

await writeFile(outputHtmlPath, html, "utf8");
