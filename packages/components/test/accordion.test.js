import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { cdp, userEvent } from "vitest/browser";

import { defineAccordion } from "../src/accordion.js";
import { exposedNodes } from "./helpers/accessibility.js";
import { expectRendered } from "./helpers/rendered.js";
import { resolvedValue } from "./helpers/tokens.js";

const tag = "test-ds-accordion";

beforeAll(() => defineAccordion(tag));

afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

function render(attributes = "", { expanded = [] } = {}) {
  const open = (value) => (expanded.includes(value) ? " expanded" : "");
  document.body.innerHTML = `<button>Before</button><${tag} ${attributes}>
    <ds-accordion-section label="Shipping"${open("shipping")}><p>Shipping content</p></ds-accordion-section>
    <ds-accordion-section label="Returns"${open("returns")}><p>Returns content <a href="#returns">policy</a></p></ds-accordion-section>
    <ds-accordion-section label="Warranty"${open("warranty")}><p>Warranty content</p></ds-accordion-section>
  </${tag}><button>After</button>`;
  return document.querySelector(tag);
}

function triggers(host) {
  return [...host.shadowRoot.querySelectorAll('[part="trigger"]')];
}

function sections(host) {
  return [...host.querySelectorAll("ds-accordion-section")];
}

/** The sections a person can see, by label. */
function shown(host) {
  return sections(host)
    .filter((section) => section.getClientRects().length > 0)
    .map((section) => section.label);
}

function toggles(host) {
  const received = [];
  host.addEventListener("toggle", (event) =>
    received.push(`${event.detail.section.label} ${event.detail.section.expanded}`),
  );
  return received;
}

describe("DsAccordion", () => {
  test("[sections-toggle] starts with every section collapsed unless one is marked expanded", () => {
    expect(shown(render())).toEqual([]);
    expect(shown(render("", { expanded: ["returns"] }))).toEqual(["Returns"]);
  });

  test("[sections-toggle] clicking a trigger expands its section and clicking again collapses it", async () => {
    const host = render();
    await userEvent.click(triggers(host)[0]);
    await userEvent.click(triggers(host)[2]);
    expect(shown(host)).toEqual(["Shipping", "Warranty"]);
    await userEvent.click(triggers(host)[0]);
    await userEvent.click(triggers(host)[2]);
    expect(shown(host)).toEqual([]);
  });

  test("[sections-toggle] with exclusive, expanding a section collapses the expanded one", async () => {
    const host = render("exclusive");
    await userEvent.click(triggers(host)[0]);
    await userEvent.click(triggers(host)[1]);
    expect(shown(host)).toEqual(["Returns"]);
    await userEvent.click(triggers(host)[1]);
    expect(shown(host)).toEqual([]);
  });

  test("[sections-toggle] with exclusive, a section expanded programmatically collapses the others", async () => {
    const host = render("exclusive", { expanded: ["shipping", "warranty"] });
    expect(shown(host)).toEqual(["Shipping"]);
    sections(host)[2].expanded = true;
    await new Promise((resolve) => setTimeout(resolve));
    expect(shown(host)).toEqual(["Warranty"]);
  });

  test("[toggle-reports] reports toggle for each section the person changes", async () => {
    const host = render("exclusive");
    const received = toggles(host);
    await userEvent.click(triggers(host)[0]);
    await userEvent.click(triggers(host)[1]);
    expect(received).toEqual(["Shipping true", "Shipping false", "Returns true"]);
  });

  test("[toggle-reports] reports nothing when a section changes programmatically", async () => {
    const host = render();
    const received = toggles(host);
    sections(host)[0].expanded = true;
    sections(host)[0].expanded = false;
    await new Promise((resolve) => setTimeout(resolve));
    expectRendered(host, "trigger");
    expect(received).toEqual([]);
  });

  test("[collapsed-content-hidden] keeps collapsed content out of view, focus, and the accessibility tree", async () => {
    const host = render("", { expanded: ["shipping"] });
    expectRendered(host, "trigger", "panel");
    const names = (await exposedNodes()).map((node) => node.name);
    expect(names).toContain("Shipping content");
    expect(names).not.toContain("Returns content");
    expect(names).not.toContain("Warranty content");

    // Shipping's content has nothing focusable, so Tab goes trigger to trigger.
    triggers(host)[0].focus();
    await userEvent.tab();
    expect(host.shadowRoot.activeElement).toBe(triggers(host)[1]);
    await userEvent.tab();
    expect(host.shadowRoot.activeElement).toBe(triggers(host)[2]);
  });

  test("[accessible-triggers] exposes each trigger as a named button inside a heading", async () => {
    const host = render("", { expanded: ["shipping"] });
    const nodes = await exposedNodes();
    const buttons = nodes.filter((node) => node.role === "button").map((node) => node.name);
    expect(buttons).toEqual(expect.arrayContaining(["Shipping", "Returns", "Warranty"]));
    const headings = nodes.filter((node) => node.role === "heading").map((node) => node.name);
    expect(headings).toEqual(["Shipping", "Returns", "Warranty"]);
    expect(nodes).toContainEqual({ role: "region", name: "Shipping" });

    const levels = () =>
      [...host.shadowRoot.querySelectorAll('[role="heading"]')].map((heading) =>
        heading.getAttribute("aria-level"),
      );
    expect(levels()).toEqual(["3", "3", "3"]);
    host.headingLevel = 2;
    expect(levels()).toEqual(["2", "2", "2"]);
    host.headingLevel = 9;
    expect(host.headingLevel).toBe(3);
    expect(levels()).toEqual(["3", "3", "3"]);
  });

  test("[accessible-triggers] each trigger exposes whether its section is expanded", async () => {
    const host = render("", { expanded: ["returns"] });
    const expanded = () => triggers(host).map((trigger) => trigger.getAttribute("aria-expanded"));
    expect(expanded()).toEqual(["false", "true", "false"]);
    await userEvent.click(triggers(host)[0]);
    expect(expanded()).toEqual(["true", "true", "false"]);
    for (const trigger of triggers(host)) {
      const panel = host.shadowRoot.getElementById(trigger.getAttribute("aria-controls"));
      expect(panel?.getAttribute("part")).toBe("panel");
    }
  });

  test("[keyboard-accordion] Tab moves through triggers and expanded content in order", async () => {
    const host = render("", { expanded: ["returns"] });
    document.querySelector("button").focus();
    await userEvent.tab();
    expect(host.shadowRoot.activeElement).toBe(triggers(host)[0]);
    await userEvent.tab();
    expect(host.shadowRoot.activeElement).toBe(triggers(host)[1]);
    await userEvent.tab();
    expect(document.activeElement).toBe(host.querySelector("a"));
    await userEvent.tab();
    expect(host.shadowRoot.activeElement).toBe(triggers(host)[2]);
  });

  test("[keyboard-accordion] Enter and Space toggle the focused trigger's section", async () => {
    const host = render();
    triggers(host)[1].focus();
    await userEvent.keyboard("{Enter}");
    expect(shown(host)).toEqual(["Returns"]);
    await userEvent.keyboard(" ");
    expect(shown(host)).toEqual([]);
  });

  test("[keyboard-accordion] the arrow keys do not move focus", async () => {
    const host = render();
    triggers(host)[0].focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(host.shadowRoot.activeElement).toBe(triggers(host)[0]);
  });

  test("[visible-expanded-state] the indicator turns to show the expanded state", async () => {
    const host = render("", { expanded: ["shipping"] });
    const indicators = [...host.shadowRoot.querySelectorAll('[part="indicator"]')];
    const [open, closed] = indicators.map((indicator) => getComputedStyle(indicator).transform);
    expect(open).not.toBe(closed);
    expect(getComputedStyle(indicators[1]).borderInlineEndStyle).not.toBe("none");
  });

  test("[visible-expanded-state] the indicator and focus keep system colors under forced colors", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    const host = render();
    const indicator = host.shadowRoot.querySelector('[part="indicator"]');
    expect(getComputedStyle(indicator).forcedColorAdjust).toBe("none");
    triggers(host)[0].focus();
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    const trigger = triggers(host)[0];
    expect(trigger.matches(":focus-visible")).toBe(true);
    expect(getComputedStyle(trigger).outlineStyle).not.toBe("none");
  });

  test("reads the tokens the spec maps", () => {
    const host = render();
    const trigger = triggers(host)[0];
    expect(getComputedStyle(trigger).color).toBe(
      resolvedValue("color", "var(--ds-semantic-color-foreground-default)"),
    );
    expect(getComputedStyle(trigger).fontFamily).toBe(
      resolvedValue("font-family", "var(--ds-semantic-typography-label-md-font-family)"),
    );
    const section = host.shadowRoot.querySelector('[part="section"]');
    expect(getComputedStyle(section).borderBlockEndColor).toBe(
      resolvedValue("color", "var(--ds-semantic-color-border-subtle)"),
    );
  });

  test("renders sections added after connection, and relabels them", async () => {
    const host = render();
    const added = document.createElement("ds-accordion-section");
    added.label = "Care";
    host.append(added);
    sections(host)[0].label = "Delivery";
    await new Promise((resolve) => setTimeout(resolve));
    expect(triggers(host).map((trigger) => trigger.textContent)).toEqual([
      "Delivery",
      "Returns",
      "Warranty",
      "Care",
    ]);
  });
});
