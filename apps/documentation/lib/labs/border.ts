import { contrastRatio } from "./contrast";
import { colorSwatch, tokenValue, type LabTheme } from "./tokens";

type BorderSwatch = ReturnType<typeof colorSwatch>;
type StatusBorder = BorderSwatch & { background: string };
type ActionStates = Record<"default" | "hover" | "pressed", BorderSwatch>;

const borderTheme = (theme: LabTheme) => {
  const color = (path: string) => tokenValue(theme, `semantic.color.${path}`);
  const swatch = (path: string) => colorSwatch(theme, `semantic.color.${path}`);

  return {
    foreground: color("foreground.default"),
    muted: color("foreground.muted"),
    backgrounds: {
      default: color("background.default"),
      surface: color("background.surface"),
      sunken: color("background.sunken"),
      muted: color("background.muted"),
      disabled: color("background.disabled"),
      brandMuted: color("background.brand.muted"),
    },
    borders: {
      default: swatch("border.default"),
      strong: swatch("border.strong"),
      subtle: swatch("border.subtle"),
      disabled: swatch("border.disabled"),
      focus: swatch("border.focus"),
      brandMuted: swatch("border.brand.muted"),
    },
    actions: Object.fromEntries(
      ["primary", "destructive"].map((intent) => [
        intent,
        Object.fromEntries(
          ["default", "hover", "pressed"].map((state) => [
            state,
            swatch(`border.action.${intent}.${state}`),
          ]),
        ),
      ]),
    ) as Record<"primary" | "destructive", ActionStates>,
    status: Object.fromEntries(
      ["success", "warning", "info", "danger"].map((intent) => {
        const border = swatch(`border.status.${intent}.default`);
        return [intent, { ...border, background: color(`background.status.${intent}.default`) }];
      }),
    ) as Record<"success" | "warning" | "info" | "danger", StatusBorder>,
  };
};

export const renderBorderBoard = (themeName: LabTheme) => {
  const theme = borderTheme(themeName);
  const { foreground, muted, backgrounds, borders, actions, status } = theme;
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
          <div class="border-role-head"><b>border.${name}</b><code>${border.value}</code></div>
          <div class="border-surface-strip">${samples}</div>
          <span class="border-contract ${functional && minimum >= 3 ? "pass" : ""}">${functional ? `foundations ≥ ${minimum.toFixed(2)}:1` : `decorative · ${minimum.toFixed(2)}:1 minimum`}</span>
        </article>`;
    })
    .join("");

  const actionFamilies = Object.entries(actions)
    .map(([intent, states]) => {
      const stateMarkup = Object.entries(states)
        .map(([state, border]) => {
          const minimum = Math.min(
            ...foundationBackgrounds.map(([, background]) =>
              contrastRatio(border.value, background),
            ),
          );
          return `<div class="action-border-state" style="--action-border:${border.value};--action-surface:${backgrounds.surface}">
              <b>${state}</b><code>${border.value}</code>
              <span class="border-contract ${minimum >= 3 ? "pass" : ""}">foundations ≥ ${minimum.toFixed(2)}:1</span>
            </div>`;
        })
        .join("");
      return `<article class="action-border-family"><h3>border.action.${intent}</h3><div class="action-border-states">${stateMarkup}</div></article>`;
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
          <code>${values.value}</code>
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
        <p class="board-section-label">Interactive action boundaries</p>
        <div class="action-border-grid">${actionFamilies}</div>
        <p class="board-section-label">Focus and unavailable state</p>
        <div class="border-special-grid">
          <article class="border-special-card" style="--special-bg:${backgrounds.surface};--focus-bg:${backgrounds.default};--focus-control:${backgrounds.surface};--focus-border:${borders.focus.value}">
            <h3>border.focus</h3><code>${borders.focus.value}</code>
            <div class="focus-specimen"><span>Focus indicator</span></div>
            <span class="border-contract ${focusMinimum >= 3 ? "pass" : ""}">foundations ≥ ${focusMinimum.toFixed(2)}:1</span>
          </article>
          <article class="border-special-card" style="--special-bg:${backgrounds.surface};--disabled-bg:${backgrounds.disabled};--disabled-border:${borders.disabled.value}">
            <h3>border.disabled</h3><code>${borders.disabled.value}</code>
            <div class="disabled-specimen">Unavailable boundary</div>
            <span class="border-contract">contrast-exempt · ${disabledRatio.toFixed(2)}:1</span>
          </article>
        </div>
        <p class="board-section-label">Decorative brand boundary</p>
        <article class="brand-border-card" style="--brand-border:${borders.brandMuted.value};--brand-bg:${backgrounds.brandMuted}">
          <b>border.brand.muted</b><code>${borders.brandMuted.value} · decorative ${brandRatio.toFixed(2)}:1</code>
        </article>
        <p class="board-section-label">Status boundaries on quiet fills</p>
        <div class="status-border-grid">${statusCards}</div>
        <p class="border-footnote">Contrast badges use the current built token values. Default, strong, focus, action, and status boundaries target 3:1. Subtle and muted-brand roles are decorative; disabled is shown for differentiation but is exempt. The width control previews <code>primitives.border.thin</code> and <code>primitives.border.thick</code> without changing color ratios.</p>`,
  };
};
