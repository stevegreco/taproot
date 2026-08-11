import { contrastRatio } from "./contrast";

type Swatch = { value: string; source: string };
type StatusSwatch = Swatch & { background: string; foreground: string };

export type ForegroundTheme = {
  foregrounds: {
    default: Swatch;
    muted: Swatch;
    disabled: Swatch;
    brand: Swatch;
    onBrand: Swatch;
    onAction: Swatch;
  };
  backgrounds: Record<"default" | "surface" | "sunken" | "muted", string>;
  pairs: {
    brand: string;
    action: Record<"default" | "hover" | "pressed", string>;
  };
  status: Record<"success" | "warning" | "info" | "danger", StatusSwatch>;
};

export const FOREGROUND_THEMES: Record<"light" | "dark", ForegroundTheme> = {
  light: {
    foregrounds: {
      default: { value: "#171717", source: "gray.950" },
      muted: { value: "#5f5f5f", source: "gray.600" },
      disabled: { value: "#777777", source: "gray.500" },
      brand: { value: "#a0501d", source: "robRoy.700" },
      onBrand: { value: "#fcfcfc", source: "gray.25" },
      onAction: { value: "#fcfcfc", source: "gray.25" },
    },
    backgrounds: {
      default: "#faf6f0",
      surface: "#fcfcfc",
      sunken: "#f2ebdf",
      muted: "#e0e7e3",
    },
    pairs: {
      brand: "#a0501d",
      action: { default: "#a0501d", hover: "#823f1e", pressed: "#6b341c" },
    },
    status: {
      success: { foreground: "#3a5830", source: "moss.800", background: "#e3ecd9", value: "#3a5830" },
      warning: { foreground: "#654f15", source: "amber.800", background: "#f4f0b3", value: "#654f15" },
      info: { foreground: "#244960", source: "sky.800", background: "#d6e1ea", value: "#244960" },
      danger: { foreground: "#6b2616", source: "rust.800", background: "#f5dbd0", value: "#6b2616" },
    },
  },
  dark: {
    foregrounds: {
      default: { value: "#fcfcfc", source: "gray.25" },
      muted: { value: "#b9b9b9", source: "gray.300" },
      disabled: { value: "#777777", source: "gray.500" },
      brand: { value: "#e1ac3e", source: "robRoy.400" },
      onBrand: { value: "#171717", source: "gray.950" },
      onAction: { value: "#171717", source: "gray.950" },
    },
    backgrounds: {
      default: "#171c1a",
      surface: "#2c3531",
      sunken: "#0e1211",
      muted: "#323d38",
    },
    pairs: {
      brand: "#e1ac3e",
      action: { default: "#e1ac3e", hover: "#e8c468", pressed: "#efda98" },
    },
    status: {
      success: { foreground: "#e3ecd9", source: "moss.100", background: "#2c4623", value: "#e3ecd9" },
      warning: { foreground: "#f4f0b3", source: "amber.100", background: "#554015", value: "#f4f0b3" },
      info: { foreground: "#d6e1ea", source: "sky.100", background: "#244960", value: "#d6e1ea" },
      danger: { foreground: "#f5dbd0", source: "rust.100", background: "#6b2616", value: "#f5dbd0" },
    },
  },
};

export const renderForegroundBoard = (themeName: "light" | "dark") => {
  const theme = FOREGROUND_THEMES[themeName];
  const { foregrounds, backgrounds, pairs, status } = theme;

  const surfaceTests = Object.entries(backgrounds)
    .map(([name, background]) => {
      const defaultRatio = contrastRatio(foregrounds.default.value, background);
      const mutedRatio = contrastRatio(foregrounds.muted.value, background);
      const brandRatio = contrastRatio(foregrounds.brand.value, background);
      return `<article class="surface-test ${name}">
          <span class="surface-name">background.${name}</span>
          <span class="surface-primary">Default foreground carries the message.</span>
          <span class="surface-secondary">Muted foreground supports it with context.</span>
          <span class="surface-brand">Brand foreground expresses identity.</span>
          <div class="contrast-line">
            <span class="contrast-pill ${defaultRatio >= 4.5 ? "pass" : ""}">default ${defaultRatio.toFixed(2)}:1</span>
            <span class="contrast-pill ${mutedRatio >= 4.5 ? "pass" : ""}">muted ${mutedRatio.toFixed(2)}:1</span>
            <span class="contrast-pill ${brandRatio >= 4.5 ? "pass" : ""}">brand ${brandRatio.toFixed(2)}:1</span>
          </div>
        </article>`;
    })
    .join("");

  const brandPairRatio = contrastRatio(foregrounds.onBrand.value, pairs.brand);
  const actionPairs = Object.entries(pairs.action)
    .map(([state, background]) => {
      const ratio = contrastRatio(foregrounds.onAction.value, background);
      return `<div class="action-pair-state ${state}"><b>${state}</b><span>foreground.on.action.primary</span><span>${ratio.toFixed(2)}:1</span></div>`;
    })
    .join("");

  const statusTests = Object.entries(status)
    .map(([intent, values]) => {
      const foundationMinimum = Math.min(
        ...Object.values(backgrounds).map((background) =>
          contrastRatio(values.foreground, background),
        ),
      );
      const pairRatio = contrastRatio(foregrounds.default.value, values.background);
      return `<article class="status-foreground-card" style="--status-fg:${values.foreground};--status-bg:${values.background};--status-on:${foregrounds.default.value}">
          <div class="status-direct">
            <b>foreground.status.${intent}.default</b>
            <code>${values.source} · ${values.foreground}</code>
            <div class="contrast-line"><span class="contrast-pill ${foundationMinimum >= 4.5 ? "pass" : ""}">foundations ≥ ${foundationMinimum.toFixed(2)}:1</span></div>
          </div>
          <div class="status-pair">
            <b>foreground.default</b>
            <code>on background.status.${intent}.default</code>
            <div class="contrast-line"><span class="contrast-pill ${pairRatio >= 4.5 ? "pass" : ""}">${pairRatio.toFixed(2)}:1</span></div>
          </div>
        </article>`;
    })
    .join("");

  return `
        <span class="map-label">foundation foregrounds</span>
        <section class="type-sheet">
          <p class="type-eyebrow">A real text specimen</p>
          <h2>Clarity starts with a quiet hierarchy.</h2>
          <p>Primary content should feel effortless to read. Supporting content should step back without becoming faint or ambiguous.</p>
          <div class="foreground-roles">
            <div class="foreground-role default"><div><b>Default foreground</b><span>Primary text and icons</span></div><code>${foregrounds.default.source} · ${foregrounds.default.value}</code></div>
            <div class="foreground-role muted"><div><b>Muted foreground</b><span>Secondary or supporting text and icons</span></div><code>${foregrounds.muted.source} · ${foregrounds.muted.value}</code></div>
            <div class="foreground-role disabled"><div><b>Disabled foreground</b><span>Unavailable text and icons</span></div><code>${foregrounds.disabled.source} · ${foregrounds.disabled.value}</code></div>
            <div class="foreground-role brand"><div><b>Brand foreground</b><span>Non-interactive brand-colored text and icons</span></div><code>${foregrounds.brand.source} · ${foregrounds.brand.value}</code></div>
          </div>
        </section>
        <div class="surface-tests">${surfaceTests}</div>
        <p class="board-section-label">Explicit brand and action pairs</p>
        <div class="paired-tests">
          <article class="paired-card">
            <h3>foreground.on.brand.default</h3>
            <p>Content paired specifically with background.brand.default.</p>
            <div class="contrast-line"><span class="contrast-pill ${brandPairRatio >= 4.5 ? "pass" : ""}">${foregrounds.onBrand.source} · ${foregrounds.onBrand.value} · ${brandPairRatio.toFixed(2)}:1</span></div>
          </article>
          <article class="paired-card action-pair">${actionPairs}</article>
        </div>
        <p class="board-section-label">Status colors and quiet fills</p>
        <div class="status-foreground-tests">${statusTests}</div>
        <p class="foreground-footnote">Contrast badges measure enabled foreground text against each supported background. One on-action foreground is tested against default, hover, and pressed fills. Status cards compare direct status-colored content with foreground.default on each quiet fill. Disabled foreground remains a visual candidate rather than a WCAG target.</p>`;
};
