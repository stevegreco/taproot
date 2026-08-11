import { contrastRatio } from "./contrast";

type BorderSwatch = { value: string; source: string };
type StatusBorder = BorderSwatch & { background: string };

export type BorderTheme = {
  foreground: string;
  muted: string;
  backgrounds: Record<
    "default" | "surface" | "sunken" | "muted" | "disabled" | "brandMuted",
    string
  >;
  borders: Record<
    "default" | "strong" | "subtle" | "disabled" | "focus" | "brandMuted",
    BorderSwatch
  >;
  status: Record<"success" | "warning" | "info" | "danger", StatusBorder>;
};

export const BORDER_THEMES: Record<"light" | "dark", BorderTheme> = {
  light: {
    foreground: "#171717",
    muted: "#5f5f5f",
    backgrounds: {
      default: "#faf6f0",
      surface: "#fcfcfc",
      sunken: "#f2ebdf",
      muted: "#e0e7e3",
      disabled: "#e7e7e7",
      brandMuted: "#f7edce",
    },
    borders: {
      default: { value: "#777777", source: "gray.500" },
      strong: { value: "#5f5f5f", source: "gray.600" },
      subtle: { value: "#d5d5d5", source: "gray.200" },
      disabled: { value: "#b9b9b9", source: "gray.300" },
      focus: { value: "#a0501d", source: "robRoy.700" },
      brandMuted: { value: "#efda98", source: "robRoy.200" },
    },
    status: {
      success: { value: "#4a6b3d", source: "moss.700", background: "#e3ecd9" },
      warning: { value: "#7b6314", source: "amber.700", background: "#f4f0b3" },
      info: { value: "#2f5973", source: "sky.700", background: "#d6e1ea" },
      danger: { value: "#84301c", source: "rust.700", background: "#f5dbd0" },
    },
  },
  dark: {
    foreground: "#fcfcfc",
    muted: "#b9b9b9",
    backgrounds: {
      default: "#171c1a",
      surface: "#2c3531",
      sunken: "#0e1211",
      muted: "#323d38",
      disabled: "#2b2b2b",
      brandMuted: "#3d1a0b",
    },
    borders: {
      default: { value: "#989898", source: "gray.400" },
      strong: { value: "#b9b9b9", source: "gray.300" },
      subtle: { value: "#373737", source: "gray.800" },
      disabled: { value: "#484848", source: "gray.700" },
      focus: { value: "#e1ac3e", source: "robRoy.400" },
      brandMuted: { value: "#823f1e", source: "robRoy.800" },
    },
    status: {
      success: { value: "#a2be8c", source: "moss.300", background: "#2c4623" },
      warning: { value: "#dbcb1b", source: "amber.300", background: "#554015" },
      info: { value: "#8aacc4", source: "sky.300", background: "#244960" },
      danger: { value: "#e09074", source: "rust.300", background: "#6b2616" },
    },
  },
};

export const renderBorderBoard = (themeName: "light" | "dark") => {
  const theme = BORDER_THEMES[themeName];
  const { foreground, muted, backgrounds, borders, status } = theme;
  const foundationBackgrounds = Object.entries(backgrounds).filter(([name]) =>
    ["default", "surface", "sunken", "muted"].includes(name),
  );

  const foundationRows = (["default", "strong", "subtle"] as const)
    .map((name) => {
      const border = borders[name];
      const ratios = foundationBackgrounds.map(([, background]) =>
        contrastRatio(border.value, background),
      );
      const minimum = Math.min(...ratios);
      const samples = foundationBackgrounds
        .map(([surface, background]) => {
          const sampleInk =
            contrastRatio(foreground, background) >= contrastRatio("#ffffff", background)
              ? foreground
              : "#ffffff";
          return `<div class="border-surface-sample" style="--border-value:${border.value};--sample-bg:${background};--sample-ink:${sampleInk}">${surface}</div>`;
        })
        .join("");
      const functional = name !== "subtle";
      return `<article class="border-role-row">
          <div class="border-role-head"><b>border.${name}</b><code>${border.source} · ${border.value}</code></div>
          <div class="border-surface-strip">${samples}</div>
          <span class="border-contract ${functional && minimum >= 3 ? "pass" : ""}">${functional ? `foundations ≥ ${minimum.toFixed(2)}:1` : `decorative · ${minimum.toFixed(2)}:1 minimum`}</span>
        </article>`;
    })
    .join("");

  const focusMinimum = Math.min(
    ...foundationBackgrounds.map(([, background]) =>
      contrastRatio(borders.focus.value, background),
    ),
  );
  const disabledRatio = contrastRatio(borders.disabled.value, backgrounds.disabled);
  const brandRatio = contrastRatio(borders.brandMuted.value, backgrounds.brandMuted);
  const statusCards = Object.entries(status)
    .map(([intent, values]) => {
      const pairRatio = contrastRatio(values.value, values.background);
      return `<article class="status-border-card" style="--status-border:${values.value};--status-bg:${values.background}">
          <b>border.status.${intent}.default</b>
          <code>${values.source} · ${values.value}</code>
          <span class="border-contract ${pairRatio >= 3 ? "pass" : ""}">${pairRatio.toFixed(2)}:1 on quiet fill</span>
        </article>`;
    })
    .join("");

  return {
    style: {
      "--fg-default": foreground,
      "--fg-muted": muted,
      "--border-page": backgrounds.default,
      "--border-surface": backgrounds.surface,
    },
    html: `
        <span class="map-label">foundation boundaries</span>
        <section class="border-foundation">
          <h2>One hierarchy, four surfaces.</h2>
          <p>Functional borders stay perceivable across default, surface, sunken, and muted backgrounds. Subtle remains decorative.</p>
          <div class="border-role-list">${foundationRows}</div>
        </section>
        <p class="board-section-label">Focus and unavailable state</p>
        <div class="border-special-grid">
          <article class="border-special-card" style="--special-bg:${backgrounds.surface};--focus-bg:${backgrounds.default};--focus-control:${backgrounds.surface};--focus-border:${borders.focus.value}">
            <h3>border.focus</h3><code>${borders.focus.source} · ${borders.focus.value}</code>
            <div class="focus-specimen"><span>Focus indicator</span></div>
            <span class="border-contract ${focusMinimum >= 3 ? "pass" : ""}">foundations ≥ ${focusMinimum.toFixed(2)}:1</span>
          </article>
          <article class="border-special-card" style="--special-bg:${backgrounds.surface};--disabled-bg:${backgrounds.disabled};--disabled-border:${borders.disabled.value}">
            <h3>border.disabled</h3><code>${borders.disabled.source} · ${borders.disabled.value}</code>
            <div class="disabled-specimen">Unavailable boundary</div>
            <span class="border-contract">contrast-exempt · ${disabledRatio.toFixed(2)}:1</span>
          </article>
        </div>
        <p class="board-section-label">Decorative brand boundary</p>
        <article class="brand-border-card" style="--brand-border:${borders.brandMuted.value};--brand-bg:${backgrounds.brandMuted}">
          <b>border.brand.muted</b><code>${borders.brandMuted.source} · ${borders.brandMuted.value} · decorative ${brandRatio.toFixed(2)}:1</code>
        </article>
        <p class="board-section-label">Status boundaries on quiet fills</p>
        <div class="status-border-grid">${statusCards}</div>
        <p class="border-footnote">Contrast badges measure border color against the immediately adjacent fill. Default, strong, focus, and status boundaries target 3:1. Subtle and muted-brand roles are intentionally decorative; disabled is shown for differentiation but is exempt. The width control previews <code>primitives.border.thin</code> and <code>primitives.border.thick</code> without changing the color ratios.</p>`,
  };
};
