import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { cdp, userEvent } from "vitest/browser";

import { defineButton } from "../src/button.js";
import { defineCard } from "../src/card.js";
import { exposedNodes } from "./helpers/accessibility.js";
import { expectRendered } from "./helpers/rendered.js";
import { resolvedValue } from "./helpers/tokens.js";

const tagName = "test-ds-card";
const buttonTag = "test-ds-card-button";
const label = "Quarterly revenue report";

beforeAll(() => {
  defineCard(tagName);
  defineButton(buttonTag);
});

afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.querySelector(tagName);
}

function part(card, name) {
  return card.shadowRoot.querySelector(`[part="${name}"]`);
}

function linkedCard(attributes = "") {
  return render(`
    <${tagName} label="${label}" href="#card-destination" ${attributes}>
      <p>Revenue grew 12% over the previous quarter.</p>
      <${buttonTag} slot="actions" variant="tertiary">Share</${buttonTag}>
    </${tagName}>
    <button>After</button>`);
}

/** Records clicks that reach the card, and whether each came from the destination link. */
function recordActivations(card) {
  const activations = [];
  card.addEventListener("click", (event) => {
    event.preventDefault();
    activations.push(event.composedPath().includes(part(card, "title-link")));
  });
  return activations;
}

describe("DsCard", () => {
  test("[title-is-heading] exposes the title as a heading at the heading level", async () => {
    const card = render(`<${tagName} label="${label}" heading-level="5"></${tagName}>`);

    expect(await exposedNodes()).toContainEqual({ role: "heading", name: label });
    expect(part(card, "title").getAttribute("aria-level")).toBe("5");

    card.headingLevel = 9;
    expect(card.headingLevel).toBe(3);
    expect(part(card, "title").getAttribute("aria-level")).toBe("3");
  });

  test("[one-destination] follows the destination from the title or the body, with one tab stop", async () => {
    const card = linkedCard();
    const activations = recordActivations(card);

    await userEvent.tab();
    expect(card.shadowRoot.activeElement).toBe(part(card, "title-link"));
    await userEvent.keyboard("{Enter}");
    // Pointer activation on the body text lands on the extended target.
    await userEvent.click(card.querySelector("p"), { force: true });

    expect(activations).toEqual([true, true]);
    await userEvent.tab();
    expect(document.activeElement).toBe(card.querySelector(buttonTag));
  });

  test("[destination-named-by-label] names the link by the label alone", async () => {
    linkedCard();

    const links = (await exposedNodes()).filter((node) => node.role === "link");
    expect(links).toEqual([{ role: "link", name: label }]);
  });

  test("[actions-stay-separate] keeps actions focusable and never follows the destination from them", async () => {
    const card = linkedCard();
    const activations = recordActivations(card);
    const action = card.querySelector(buttonTag);

    await userEvent.click(action);
    action.focus();
    await userEvent.keyboard("{Enter}");

    expect(activations.length).toBeGreaterThan(0);
    expect(activations.every((fromLink) => !fromLink)).toBe(true);
  });

  test("[no-destination-no-link] renders plain heading text with no tab stop or hover", async () => {
    const card = render(`
      <button>Before</button>
      <${tagName} label="${label}"><p>Body</p></${tagName}>
      <button>After</button>`);
    expectRendered(card, "surface", "title", "title-link");
    const nodes = await exposedNodes();

    expect(nodes).toContainEqual({ role: "heading", name: label });
    expect(nodes.filter((node) => node.role === "link")).toEqual([]);

    document.querySelector("button").focus();
    await userEvent.tab();
    expect(document.activeElement.textContent).toBe("After");

    await userEvent.hover(part(card, "surface"));
    expect(getComputedStyle(part(card, "surface")).boxShadow).toBe(
      resolvedValue("box-shadow", "var(--ds-semantic-elevation-sm)"),
    );
  });

  test("lifts on hover when it has a destination", async () => {
    const card = linkedCard();

    await userEvent.hover(card.querySelector("p"), { force: true });

    const surface = getComputedStyle(part(card, "surface"));
    expect(surface.boxShadow).toBe(resolvedValue("box-shadow", "var(--ds-semantic-elevation-md)"));
    expect(surface.borderTopColor).toBe(
      resolvedValue("border-color", "var(--ds-semantic-color-border-default)"),
    );
  });

  test("[visible-focus] draws the focus ring around the whole surface", async () => {
    const card = linkedCard();

    await userEvent.tab();

    const surface = getComputedStyle(part(card, "surface"));
    expect(surface.outlineStyle).toBe("solid");
    expect(parseFloat(surface.outlineWidth)).toBeGreaterThan(0);
    expect(surface.outlineColor).toBe(
      resolvedValue("color", "var(--ds-semantic-color-border-focus)"),
    );
  });

  test("[forced-colors] keeps the boundary and focus visible under forced colors", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const card = linkedCard();
    const surface = () => getComputedStyle(part(card, "surface"));

    expect(surface().borderTopStyle).toBe("solid");
    expect(surface().borderTopColor).toBe(resolvedValue("color", "CanvasText"));

    await userEvent.tab();
    expect(surface().outlineStyle).toBe("solid");
    expect(surface().outlineColor).toBe(resolvedValue("color", "Highlight"));
  });

  test("paints the surface with the mapped tokens", () => {
    const card = render(`<${tagName} label="${label}"></${tagName}>`);
    const surface = getComputedStyle(part(card, "surface"));

    expect(surface.backgroundColor).toBe(
      resolvedValue("background-color", "var(--ds-semantic-color-background-surface)"),
    );
    expect(surface.borderTopLeftRadius).toBe(
      resolvedValue("border-top-left-radius", "var(--ds-semantic-radius-surface)"),
    );
  });

  test("takes no space for empty optional parts", async () => {
    const card = render(`<${tagName} label="${label}"></${tagName}>`);
    await new Promise(requestAnimationFrame);

    expect(part(card, "media").hidden).toBe(true);
    expect(part(card, "body").hidden).toBe(true);
    expect(part(card, "actions").hidden).toBe(true);
  });
});
