import { contrastRatio } from "./contrast";
import { colorSwatch, tokenValue, type LabTheme } from "./tokens";

type Swatch = ReturnType<typeof colorSwatch>;
type StatusSwatch = Swatch & { background: string; foreground: string };
type ActionStates = Record<"default" | "hover" | "pressed", string>;

const foregroundTheme = (theme: LabTheme) => {
  const color = (path: string) => tokenValue(theme, `semantic.color.${path}`);
  const swatch = (path: string) => colorSwatch(theme, `semantic.color.${path}`);

  return {
    foregrounds: {
      default: swatch("foreground.default"),
      muted: swatch("foreground.muted"),
      disabled: swatch("foreground.disabled"),
      brand: swatch("foreground.brand.default"),
      onBrand: swatch("foreground.on.brand"),
      onPrimary: swatch("foreground.on.action.primary"),
      onDestructive: swatch("foreground.on.action.destructive"),
    },
    backgrounds: {
      default: color("background.default"),
      surface: color("background.surface"),
      sunken: color("background.sunken"),
      muted: color("background.muted"),
      disabled: color("background.disabled"),
      brand: color("background.brand.default"),
    },
    actions: {
      primary: {
        default: color("background.action.primary.default"),
        hover: color("background.action.primary.hover"),
        pressed: color("background.action.primary.pressed"),
      },
      destructive: {
        default: color("background.action.destructive.default"),
        hover: color("background.action.destructive.hover"),
        pressed: color("background.action.destructive.pressed"),
      },
    } satisfies Record<"primary" | "destructive", ActionStates>,
    status: Object.fromEntries(
      ["success", "warning", "info", "danger"].map((intent) => {
        const foreground = swatch(`foreground.status.${intent}.default`);
        return [
          intent,
          {
            ...foreground,
            foreground: foreground.value,
            background: color(`background.status.${intent}.default`),
          },
        ];
      }),
    ) as Record<"success" | "warning" | "info" | "danger", StatusSwatch>,
  };
};

const actionPair = (
  intent: "primary" | "destructive",
  foreground: Swatch,
  states: ActionStates,
) => {
  const stateMarkup = Object.entries(states)
    .map(([state, background]) => {
      const ratio = contrastRatio(foreground.value, background);
      return `<div class="action-pair-state ${state}"><b>${state}</b><span>foreground.on.action.${intent}</span><span>${ratio.toFixed(2)}:1</span></div>`;
    })
    .join("");

  return `<article class="paired-card action-pair" style="--action-on:${foreground.value};--action-default:${states.default};--action-hover:${states.hover};--action-pressed:${states.pressed}" aria-label="${intent} action foreground pairing">${stateMarkup}</article>`;
};

export const renderForegroundBoard = (themeName: LabTheme) => {
  const theme = foregroundTheme(themeName);
  const { foregrounds, backgrounds, actions, status } = theme;

  const surfaceTests = Object.entries(backgrounds)
    .filter(([name]) => ["default", "surface", "sunken", "muted"].includes(name))
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

  const brandPairRatio = contrastRatio(foregrounds.onBrand.value, backgrounds.brand);
  const statusTests = Object.entries(status)
    .map(([intent, values]) => {
      const foundationMinimum = Math.min(
        ...["default", "surface", "sunken", "muted"].map((name) =>
          contrastRatio(values.foreground, backgrounds[name as keyof typeof backgrounds]),
        ),
      );
      const pairRatio = contrastRatio(foregrounds.default.value, values.background);
      return `<article class="status-foreground-card" style="--status-fg:${values.foreground};--status-bg:${values.background};--status-on:${foregrounds.default.value}">
          <div class="status-direct">
            <b>foreground.status.${intent}.default</b>
            <code>${values.value}</code>
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

  return {
    style: {
      "--fg-default": foregrounds.default.value,
      "--fg-muted": foregrounds.muted.value,
      "--fg-disabled": foregrounds.disabled.value,
      "--fg-brand": foregrounds.brand.value,
      "--fg-page": backgrounds.default,
      "--fg-surface": backgrounds.surface,
      "--fg-sunken": backgrounds.sunken,
      "--fg-muted-bg": backgrounds.muted,
      "--fg-disabled-bg": backgrounds.disabled,
      "--fg-brand-bg": backgrounds.brand,
      "--fg-on-brand": foregrounds.onBrand.value,
    },
    html: `
        <span class="map-label">foundation foregrounds</span>
        <section class="type-sheet">
          <p class="type-eyebrow">A real text specimen</p>
          <h2>Clarity starts with a quiet hierarchy.</h2>
          <p>Primary content should feel effortless to read. Supporting content should step back without becoming faint or ambiguous.</p>
          <div class="foreground-roles">
            <div class="foreground-role default"><div><b>Default foreground</b><span>Primary text and icons</span></div><code>${foregrounds.default.path} · ${foregrounds.default.value}</code></div>
            <div class="foreground-role muted"><div><b>Muted foreground</b><span>Secondary or supporting text and icons</span></div><code>${foregrounds.muted.path} · ${foregrounds.muted.value}</code></div>
            <div class="foreground-role disabled"><div><b>Disabled foreground</b><span>Unavailable text and icons</span></div><code>${foregrounds.disabled.path} · ${foregrounds.disabled.value}</code></div>
            <div class="foreground-role brand"><div><b>Brand foreground</b><span>Non-interactive brand-colored text and icons</span></div><code>${foregrounds.brand.path} · ${foregrounds.brand.value}</code></div>
          </div>
        </section>
        <div class="surface-tests">${surfaceTests}</div>
        <p class="board-section-label">Explicit brand and action pairs</p>
        <div class="paired-tests">
          <article class="paired-card brand-pair">
            <h3>foreground.on.brand</h3>
            <p>Content paired specifically with background.brand.default.</p>
            <div class="contrast-line"><span class="contrast-pill ${brandPairRatio >= 4.5 ? "pass" : ""}">${foregrounds.onBrand.value} · ${brandPairRatio.toFixed(2)}:1</span></div>
          </article>
          ${actionPair("primary", foregrounds.onPrimary, actions.primary)}
          ${actionPair("destructive", foregrounds.onDestructive, actions.destructive)}
        </div>
        <p class="board-section-label">Status colors and quiet fills</p>
        <div class="status-foreground-tests">${statusTests}</div>
        <p class="foreground-footnote">Contrast badges use the current built token values. Each paired foreground is tested against every state in its supported background family. Status cards compare direct status-colored content with foreground.default on each quiet fill. Disabled foreground remains a visual candidate rather than a WCAG target.</p>`,
  };
};
