import { afterEach, beforeAll, describe, expect, test } from "vitest";

import { defineIcon } from "../src/icon.js";
import { exposedNodes } from "./helpers/accessibility.js";
import { expectRendered } from "./helpers/rendered.js";
import { resolvedValue } from "./helpers/tokens.js";

const tagName = "test-ds-icon";
const svg = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2 22 22H2z"/></svg>`;

beforeAll(() => {
  defineIcon(tagName);
});

afterEach(() => {
  document.body.replaceChildren();
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.firstElementChild;
}

describe("DsIcon", () => {
  test("[decorative-by-default] is hidden from assistive technology without a label", async () => {
    render(`<p>Delete <${tagName}>${svg}</${tagName}></p>`);
    expectRendered(document.querySelector(tagName), "icon");

    const nodes = await exposedNodes();

    expect(nodes.filter((node) => node.role === "img" || node.role === "image")).toEqual([]);
  });

  test("[label-when-meaningful] is a named image when it has a label", async () => {
    render(`<${tagName} label="Warning">${svg}</${tagName}>`);

    const nodes = await exposedNodes();

    expect(nodes).toContainEqual({ role: "image", name: "Warning" });
  });

  test("[decorative-by-default] becomes decorative again when its label is removed", async () => {
    const icon = render(`<${tagName} label="Warning">${svg}</${tagName}>`);

    icon.removeAttribute("label");
    const nodes = await exposedNodes();

    expect(nodes.filter((node) => node.name === "Warning")).toEqual([]);
  });

  test("never adds role or aria attributes to the host", () => {
    const icon = render(`<${tagName} label="Warning">${svg}</${tagName}>`);
    expectRendered(icon, "icon");

    expect(icon.getAttributeNames()).toEqual(["label"]);
  });

  test("[not-a-control] takes no focus and exposes no control", () => {
    const icon = render(`<${tagName} label="Warning">${svg}</${tagName}>`);
    expectRendered(icon, "icon");

    icon.focus();

    expect(document.activeElement).not.toBe(icon);
    expect(icon.shadowRoot.querySelector("a[href], button, input, [tabindex]")).toBe(null);
  });

  test("[square-box] inherits the surrounding text size by default", () => {
    render(`<p style="font-size: 30px"><${tagName}>${svg}</${tagName}></p>`);
    const icon = document.querySelector(tagName);
    const box = icon.getBoundingClientRect();

    expect(box.width).toBe(30);
    expect(box.height).toBe(30);
  });

  test.each([
    ["small", "--ds-primitives-space-4"],
    ["medium", "--ds-primitives-space-5"],
    ["large", "--ds-primitives-space-6"],
  ])("[square-box] size %s uses %s for both sides", (size, token) => {
    const icon = render(`<${tagName} size="${size}">${svg}</${tagName}>`);
    const expected = resolvedValue("width", `var(${token})`);

    expect(getComputedStyle(icon).width).toBe(expected);
    expect(getComputedStyle(icon).height).toBe(expected);
  });

  test("[square-box] scales slotted artwork to fill the square", () => {
    const icon = render(`<${tagName} size="large">${svg}</${tagName}>`);
    const artwork = icon.querySelector("svg").getBoundingClientRect();
    const box = icon.getBoundingClientRect();

    expect(artwork.width).toBe(box.width);
    expect(artwork.height).toBe(box.height);
  });

  test("[follows-text-color] paints in the surrounding text color", () => {
    render(`<p style="color: rgb(200, 0, 0)"><${tagName}>${svg}</${tagName}></p>`);
    const path = document.querySelector(`${tagName} path`);

    expect(getComputedStyle(path).fill).toBe("rgb(200, 0, 0)");
  });
});
