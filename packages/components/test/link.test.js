import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";

import { defineLink } from "../src/link.js";
import { resolvedValue } from "./helpers/tokens.js";

const tagName = "test-ds-link";

beforeAll(() => {
  defineLink(tagName);
});

afterEach(() => {
  document.body.replaceChildren();
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.firstElementChild;
}

function anchorOf(link) {
  return link.shadowRoot.querySelector("a");
}

describe("DsLink", () => {
  test("renders slotted content inside a native anchor exposed as a part", () => {
    const link = render(`<${tagName} href="/billing">View billing history</${tagName}>`);
    const anchor = anchorOf(link);
    const slot = anchor.querySelector("slot");

    expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    expect(anchor.getAttribute("part")).toBe("link");
    expect(
      slot
        .assignedNodes()
        .map((node) => node.textContent)
        .join(""),
    ).toBe("View billing history");
  });

  test("mirrors href onto the anchor and drops it when removed", () => {
    const link = render(`<${tagName} href="/a">Go</${tagName}>`);
    const anchor = anchorOf(link);

    expect(anchor.getAttribute("href")).toBe("/a");
    link.href = "/b";
    expect(anchor.getAttribute("href")).toBe("/b");
    expect(link.href).toBe("/b");

    link.removeAttribute("href");
    expect(anchor.hasAttribute("href")).toBe(false);
    expect(link.href).toBe("");
    expect(anchor.matches(":any-link")).toBe(false);
    link.focus();
    expect(link.shadowRoot.activeElement).toBe(null);
  });

  test("reflects its variant and defaults to inline", () => {
    const link = document.createElement(tagName);

    expect(link.variant).toBe("inline");
    link.variant = "standalone";
    expect(link.getAttribute("variant")).toBe("standalone");
    expect(link.variant).toBe("standalone");
  });

  test("[inline-underline][a11y-not-color-alone] inline links inherit surrounding type and stay underlined", () => {
    render(
      `<p style="font-size: 23px; font-weight: 700"><${tagName} href="#x">ADR</${tagName}></p>`,
    );
    const style = getComputedStyle(anchorOf(document.querySelector(tagName)));

    expect(style.fontSize).toBe("23px");
    expect(style.fontWeight).toBe("700");
    expect(style.textDecorationLine).toBe("underline");
  });

  test("standalone links use label type and no underline at rest", () => {
    render(`
      <p style="font-size: 23px">
        <${tagName} variant="standalone" href="#x">All</${tagName}>
      </p>
    `);
    const style = getComputedStyle(anchorOf(document.querySelector(tagName)));

    expect(style.fontSize).not.toBe("23px");
    expect(style.fontSize).toBe(
      resolvedValue("font-size", "var(--semantic-typography-label-default-font-size)"),
    );
    expect(style.textDecorationLine).toBe("none");
  });

  test("[standalone-underline-on-hover] a standalone link is underlined on hover", async () => {
    const link = render(`<${tagName} variant="standalone" href="#x">All</${tagName}>`);
    const anchor = anchorOf(link);

    expect(getComputedStyle(anchor).textDecorationLine).toBe("none");
    await userEvent.hover(anchor);
    expect(getComputedStyle(anchor).textDecorationLine).toBe("underline");
    await userEvent.unhover(anchor);
  });

  test("[platform-navigation] activating the anchor navigates natively", () => {
    const link = render(`<${tagName} href="#ds-link-target">Jump</${tagName}>`);
    let clicks = 0;
    link.addEventListener("click", () => {
      clicks += 1;
    });

    anchorOf(link).click();

    expect(clicks).toBe(1);
    expect(location.hash).toBe("#ds-link-target");
  });

  test("click() on the host navigates like a native anchor", () => {
    const link = render(`<${tagName} href="#ds-link-host">Jump</${tagName}>`);
    let clicks = 0;
    link.addEventListener("click", () => {
      clicks += 1;
    });

    link.click();

    expect(clicks).toBe(1);
    expect(location.hash).toBe("#ds-link-host");
  });

  test("without href the anchor shows no pointer", () => {
    const link = render(`<${tagName}>Text</${tagName}>`);

    expect(getComputedStyle(anchorOf(link)).cursor).toBe("auto");
    link.href = "#x";
    expect(getComputedStyle(anchorOf(link)).cursor).toBe("pointer");
  });

  test("click() without href does nothing", () => {
    const link = render(`<${tagName}>Text</${tagName}>`);

    link.click();

    expect(location.hash).toBe("");
  });

  test("[no-disabled-state] has no disabled state to set", () => {
    const link = render(`<${tagName} href="#x" disabled>Go</${tagName}>`);
    const anchor = anchorOf(link);

    expect("disabled" in link).toBe(false);
    expect(anchor.hasAttribute("aria-disabled")).toBe(false);
    link.focus();
    expect(link.shadowRoot.activeElement).toBe(anchor);
  });
});
