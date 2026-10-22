import { cdp } from "vitest/browser";
import { afterEach, beforeAll, describe, expect, test } from "vitest";

import { defineAvatar } from "../src/avatar.js";
import { exposedNodes } from "./helpers/accessibility.js";
import { expectRendered } from "./helpers/rendered.js";
import { resolvedValue } from "./helpers/tokens.js";

const tagName = "test-ds-avatar";
// A square picture that always loads, and one that never does.
const picture = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="teal"/></svg>',
)}`;
const brokenPicture = "data:image/png;base64,broken";

beforeAll(() => {
  defineAvatar(tagName);
});

afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.querySelector(tagName);
}

function part(avatar, name) {
  return avatar.shadowRoot.querySelector(`[part~="${name}"]`);
}

/** The parts that are showing, out of image, initials, and placeholder. */
function shown(avatar) {
  return ["image", "initials", "placeholder"].filter(
    (name) => getComputedStyle(part(avatar, name)).display !== "none",
  );
}

/** Resolves once the image part has loaded or failed, and its event has run. */
async function settled(avatar) {
  await part(avatar, "image")
    .decode()
    .catch(() => {});
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
}

describe("DsAvatar", () => {
  test("[named-by-person] is an image named with the person's name", async () => {
    render(`<${tagName} name="Ada Lovelace"></${tagName}>`);

    const nodes = await exposedNodes();

    expect(nodes).toContainEqual({ role: "image", name: "Ada Lovelace" });
  });

  test("[named-by-person] keeps the name when the picture shows", async () => {
    const avatar = render(`<${tagName} name="Ada Lovelace" image="${picture}"></${tagName}>`);
    await settled(avatar);

    const nodes = await exposedNodes();

    expect(nodes.filter((node) => node.name === "Ada Lovelace")).toEqual([
      { role: "image", name: "Ada Lovelace" },
    ]);
  });

  test("[named-by-person] is hidden from assistive technology when decorative", async () => {
    const avatar = render(
      `<p>Ada Lovelace <${tagName} name="Ada Lovelace" decorative></${tagName}></p>`,
    );
    expectRendered(avatar, "surface", "initials");

    const nodes = await exposedNodes();

    expect(nodes.filter((node) => node.role === "image" || node.role === "img")).toEqual([]);
    expect(nodes.filter((node) => node.name === "AL")).toEqual([]);
  });

  test("[named-by-person] is hidden from assistive technology without a name", async () => {
    const avatar = render(`<${tagName}></${tagName}>`);
    expectRendered(avatar, "surface", "placeholder");

    const nodes = await exposedNodes();

    expect(nodes.filter((node) => node.role === "image" || node.role === "img")).toEqual([]);
  });

  test("[named-by-person] follows a name change", async () => {
    const avatar = render(`<${tagName} name="Ada Lovelace"></${tagName}>`);

    avatar.name = "Grace Hopper";
    const nodes = await exposedNodes();

    expect(nodes).toContainEqual({ role: "image", name: "Grace Hopper" });
    expect(nodes.filter((node) => node.name === "Ada Lovelace")).toEqual([]);
  });

  test("never adds role or aria attributes to the host", () => {
    const avatar = render(`<${tagName} name="Ada Lovelace"></${tagName}>`);
    expectRendered(avatar, "surface");

    expect(avatar.getAttributeNames()).toEqual(["name"]);
  });

  test("[fallback-order] shows the picture once it loads", async () => {
    const avatar = render(`<${tagName} name="Ada Lovelace" image="${picture}"></${tagName}>`);
    await settled(avatar);

    await expect.poll(() => shown(avatar)).toEqual(["image"]);
  });

  test("[fallback-order] shows the initials when there is no picture", () => {
    const avatar = render(`<${tagName} name="Ada Lovelace"></${tagName}>`);
    expectRendered(avatar, "image", "initials", "placeholder");

    expect(shown(avatar)).toEqual(["initials"]);
  });

  test("[fallback-order] shows the initials when the picture fails to load", async () => {
    const avatar = render(`<${tagName} name="Ada Lovelace" image="${brokenPicture}"></${tagName}>`);
    await settled(avatar);

    expect(shown(avatar)).toEqual(["initials"]);
  });

  test("[fallback-order] shows the placeholder with neither a picture nor a name", () => {
    const avatar = render(`<${tagName}></${tagName}>`);
    expectRendered(avatar, "image", "initials", "placeholder");

    expect(shown(avatar)).toEqual(["placeholder"]);
  });

  test("[fallback-order] falls back again when the picture is removed", async () => {
    const avatar = render(`<${tagName} name="Ada Lovelace" image="${picture}"></${tagName}>`);
    await expect.poll(() => shown(avatar)).toEqual(["image"]);

    avatar.removeAttribute("image");

    expect(shown(avatar)).toEqual(["initials"]);
  });

  test("[fallback-order] shows a new picture after an earlier one failed", async () => {
    const avatar = render(`<${tagName} name="Ada Lovelace" image="${brokenPicture}"></${tagName}>`);
    await settled(avatar);

    avatar.image = picture;
    await settled(avatar);

    await expect.poll(() => shown(avatar)).toEqual(["image"]);
  });

  test.each([
    ["Ada Lovelace", "AL"],
    ["Grace Brewster Murray Hopper", "GH"],
    ["Prince", "P"],
    ["  ada   lovelace  ", "AL"],
    ["Ölga Ünal", "ÖÜ"],
  ])("[initials-from-name] %j shows %s", (name, initials) => {
    const avatar = render(`<${tagName} name="${name}"></${tagName}>`);
    expectRendered(avatar, "initials");

    expect(part(avatar, "initials").textContent).toBe(initials);
  });

  test("[not-a-control] takes no focus and exposes no control", () => {
    const avatar = render(`<${tagName} name="Ada Lovelace" image="${picture}"></${tagName}>`);
    expectRendered(avatar, "surface", "image");

    avatar.focus();

    expect(document.activeElement).not.toBe(avatar);
    expect(avatar.shadowRoot.querySelector("a[href], button, input, [tabindex]")).toBe(null);
  });

  test.each([
    ["small", "--ds-primitives-space-6"],
    ["medium", "--ds-primitives-space-8"],
    ["large", "--ds-primitives-space-12"],
  ])("[fixed-circle] size %s is a circle of %s", (size, token) => {
    const avatar = render(`<${tagName} size="${size}" name="Ada Lovelace"></${tagName}>`);
    const expected = resolvedValue("width", `var(${token})`);
    const surface = getComputedStyle(part(avatar, "surface"));

    expect(getComputedStyle(avatar).width).toBe(expected);
    expect(getComputedStyle(avatar).height).toBe(expected);
    expect(surface.borderTopLeftRadius).toBe(
      resolvedValue("border-top-left-radius", "var(--ds-semantic-radius-pill)"),
    );
    expect(surface.overflow).toBe("hidden");
  });

  test("[fixed-circle] keeps its size while the picture loads and after", async () => {
    const avatar = render(`<${tagName} name="Ada Lovelace" image="${picture}"></${tagName}>`);
    const before = avatar.getBoundingClientRect();
    await settled(avatar);
    const after = avatar.getBoundingClientRect();

    expect(after.width).toBe(before.width);
    expect(after.height).toBe(before.height);
  });

  test("[fixed-circle] crops a picture that is not square instead of stretching it", async () => {
    const avatar = render(`<${tagName} name="Ada Lovelace" image="${picture}"></${tagName}>`);
    await expect.poll(() => shown(avatar)).toEqual(["image"]);
    const image = part(avatar, "image");
    const box = avatar.getBoundingClientRect();

    expect(getComputedStyle(image).objectFit).toBe("cover");
    expect(image.getBoundingClientRect().width).toBe(box.width);
    expect(image.getBoundingClientRect().height).toBe(box.height);
  });

  test("[forced-colors] draws an edge and keeps the initials visible", async () => {
    const avatar = render(`<${tagName} name="Ada Lovelace"></${tagName}>`);
    expectRendered(avatar, "surface", "initials");

    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });

    const surface = getComputedStyle(part(avatar, "surface"));
    expect(surface.borderTopStyle).toBe("solid");
    expect(parseFloat(surface.borderTopWidth)).toBeGreaterThan(0);
    expect(surface.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(shown(avatar)).toEqual(["initials"]);
  });

  test("[forced-colors] keeps the placeholder visible", async () => {
    const avatar = render(`<${tagName}></${tagName}>`);
    expectRendered(avatar, "placeholder");

    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });

    expect(shown(avatar)).toEqual(["placeholder"]);
    expect(getComputedStyle(part(avatar, "placeholder")).color).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("paints the fallback with the muted background and foreground", () => {
    const avatar = render(`<${tagName} name="Ada Lovelace"></${tagName}>`);
    expectRendered(avatar, "surface", "initials");

    expect(getComputedStyle(part(avatar, "surface")).backgroundColor).toBe(
      resolvedValue("background-color", "var(--ds-semantic-color-background-muted)"),
    );
    expect(getComputedStyle(part(avatar, "initials")).color).toBe(
      resolvedValue("color", "var(--ds-semantic-color-foreground-muted)"),
    );
  });

  test.each([
    ["small", "--ds-semantic-typography-label-sm-font-size"],
    ["medium", "--ds-semantic-typography-label-md-font-size"],
    ["large", "--ds-primitives-text-lg"],
  ])("size %s sets the initials in %s", (size, token) => {
    const avatar = render(`<${tagName} size="${size}" name="Ada Lovelace"></${tagName}>`);
    expectRendered(avatar, "initials");

    expect(getComputedStyle(part(avatar, "initials")).fontSize).toBe(
      resolvedValue("font-size", `var(${token})`),
    );
  });
});
