/**
 * Token data and previews for the token tier stories. Everything is read from
 * the built artifacts of @taproot-ds/tokens, so the pages follow the
 * token source without a copy here. Previews paint with `var(--token)`, so
 * the theme toolbar switches them live. Color primitives are not published as
 * CSS variables, so their swatches paint the literal value instead.
 */
import { html, nothing } from "lit";
import { flatten } from "@taproot-ds/tokens/flatten";
import primitivesJson from "@taproot-ds/tokens/tokens/primitives";
import semanticLightJson from "@taproot-ds/tokens/tokens/semantic-light";
import semanticDarkJson from "@taproot-ds/tokens/tokens/semantic-dark";
import semanticMeta from "@taproot-ds/tokens/tokens/semantic-meta";

import "./tokens.css";

export const primitives = flatten(primitivesJson);
export const semanticLight = flatten(semanticLightJson);
const darkValues = new Map(flatten(semanticDarkJson).map((token) => [token.path, token.value]));

const byPath = new Map([...primitives, ...semanticLight].map((token) => [token.path, token]));
const REFERENCE = /^\{(.+)\}$/;

/** The token a `{path}` reference points to, or null for a literal value. */
function referenced(token) {
  const match = REFERENCE.exec(token.value);
  return match ? (byPath.get(match[1]) ?? null) : null;
}

/** Follows references down to the token that holds a literal value. */
function resolve(token) {
  let current = token;
  for (let next = referenced(current); next; next = referenced(current)) current = next;
  return current;
}

/** The CSS value that paints a token: its variable, or the literal for a color primitive. */
const paint = (token) =>
  token.path.startsWith("primitives.color.") ? token.value : `var(${token.cssVariable})`;

/** Tokens whose dot path starts with one of the given prefixes. */
export function select(tokens, ...prefixes) {
  return tokens.filter(({ path }) => prefixes.some((prefix) => path.startsWith(`${prefix}.`)));
}

/** How to preview a token, decided by the name of the token that holds its value. */
function kind(path) {
  const segments = path.split(".");
  const leaf = segments.at(-1);
  if (segments.includes("color")) return "color";
  if (
    segments.includes("shadow") ||
    segments.includes("shadowInk") ||
    segments.includes("elevation")
  )
    return "shadow";
  if (segments.includes("radius")) return "radius";
  if (segments.includes("space") || segments.includes("layout")) return "space";
  if (segments.includes("border") && segments[0] === "primitives") return "border";
  if (leaf === "fontFamily" || segments[1] === "font") return "fontFamily";
  if (leaf === "fontSize" || segments[1] === "text") return "fontSize";
  if (leaf === "fontWeight" || segments[1] === "weight") return "fontWeight";
  if (leaf === "letterSpacing" || segments[1] === "tracking") return "letterSpacing";
  if (leaf === "lineHeight" || segments[1] === "leading") return "lineHeight";
  if (segments[1] === "duration" || segments[1] === "ease") return "motion";
  return "none";
}

const SAMPLE = "Ember & Sage";

function preview(token) {
  const value = paint(token);
  switch (kind(resolve(token).path)) {
    case "color":
      return html`<span class="swatch" style="background: ${value}"></span>`;
    case "shadow":
      return html`<span class="shadow" style="box-shadow: ${value}"></span>`;
    case "radius":
      return html`<span class="radius" style="border-radius: ${value}"></span>`;
    case "space":
      return html`<span class="space" style="inline-size: ${value}"></span>`;
    case "border":
      return html`<span class="border" style="border-block-start-width: ${value}"></span>`;
    case "fontFamily":
      return html`<span class="sample" style="font-family: ${value}">${SAMPLE}</span>`;
    case "fontSize":
      return html`<span class="sample" style="font-size: ${value}">Aa</span>`;
    case "fontWeight":
      return html`<span class="sample" style="font-weight: ${value}">${SAMPLE}</span>`;
    case "letterSpacing":
      return html`<span class="sample" style="letter-spacing: ${value}">${SAMPLE}</span>`;
    case "lineHeight":
      return html`<span class="sample lines" style="line-height: ${value}"
        >Line one<br />Line two</span
      >`;
    case "motion":
      return html`<span class="motion"><span style="${motionStyle(token)}"></span></span>`;
    default:
      return nothing;
  }
}

/** Motion tokens animate a dot on hover, pairing a duration or easing with a neutral default. */
function motionStyle(token) {
  const property = resolve(token).path.split(".")[1];
  const value = `var(${token.cssVariable})`;
  return property === "duration"
    ? `transition-duration: ${value}`
    : `transition-duration: var(--ds-primitives-duration-slow); transition-timing-function: ${value}`;
}

const code = (text) => html`<code>${text}</code>`;

/** A table of literal-valued tokens: primitives, or one theme's worth of semantic tokens. */
export function tokenTable(tokens, { themed = false } = {}) {
  return html`
    <table class="tokens">
      <thead>
        <tr>
          <th>Preview</th>
          <th>Token</th>
          ${
            themed
              ? html`<th>Light</th>
                  <th>Dark</th>
                  <th>Use</th>`
              : html`<th>Value</th>`
          }
        </tr>
      </thead>
      <tbody>
        ${tokens.map(
          (token) => html`
            <tr>
              <td class="preview">${preview(token)}</td>
              <td>${code(token.cssVariable)}</td>
              ${
                themed
                  ? html`<td>${code(token.value)}</td>
                      <td>${code(darkValues.get(token.path) ?? "")}</td>
                      <td class="use">${semanticMeta[token.path]?.description ?? ""}</td>`
                  : html`<td>${code(token.value)}</td>`
              }
            </tr>
          `,
        )}
      </tbody>
    </table>
  `;
}

/** Semantic typography roles, one specimen each, set entirely by the role's tokens. */
export function typeSpecimens(tokens) {
  const roles = Map.groupBy(tokens, ({ path }) => path.split(".").slice(0, -1).join("."));
  return html`
    <div class="specimens">
      ${[...roles.values()].map((group) => {
        const leaves = new Map(group.map((token) => [token.path.split(".").at(-1), token]));
        const style = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing"]
          .filter((leaf) => leaves.has(leaf))
          .map(
            (leaf) =>
              `${leaf.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: var(${leaves.get(leaf).cssVariable})`,
          )
          .join("; ");
        const prefix = group[0].cssVariable.replace(/-[a-z]+(-[a-z]+)?$/, "");
        return html`
          <figure class="specimen">
            <p style=${style}>The quick brown fox jumps over the lazy dog</p>
            <figcaption>
              ${code(`${prefix}-*`)}
              <span>${group.map(({ value }) => value).join(" · ")}</span>
            </figcaption>
          </figure>
        `;
      })}
    </div>
  `;
}

/** Color ramps, one row per family, each step labelled with its name and value. */
export function ramps(tokens) {
  const families = Map.groupBy(tokens, ({ path }) => path.split(".").slice(0, -1).join("."));
  return html`
    <div class="ramps">
      ${[...families.values()].map(
        (steps) => html`
          <section class="ramp">
            ${code(steps[0].path.replace(/\.[^.]+$/, ".*"))}
            <ol>
              ${steps.map(
                (token) => html`
                  <li>
                    <span class="swatch" style="background: ${paint(token)}"></span>
                    <span>${token.path.split(".").at(-1)}</span>
                    ${code(token.value)}
                  </li>
                `,
              )}
            </ol>
          </section>
        `,
      )}
    </div>
  `;
}
