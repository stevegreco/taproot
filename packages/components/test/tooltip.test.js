import { userEvent } from "vitest/browser";
import { afterEach, beforeAll, describe, expect, test } from "vitest";

import { defineButton } from "../src/button.js";
import { defineDialog } from "../src/dialog.js";
import { defineTooltip } from "../src/tooltip.js";
import { exposedNodes } from "./helpers/accessibility.js";
import { expectRendered } from "./helpers/rendered.js";
import { resolvedValue } from "./helpers/tokens.js";

const tagName = "test-ds-tooltip";
const buttonTag = "test-ds-tooltip-button";
const dialogTag = "test-ds-tooltip-dialog";

/** Longer than the hover delay, so a bubble that is going to open has opened. */
const PAST_DELAY = 600;

beforeAll(() => {
  defineTooltip(tagName);
  defineButton(buttonTag);
  defineDialog(dialogTag);
});

afterEach(async () => {
  await userEvent.unhover(document.body);
  document.activeElement?.blur();
  document.body.replaceChildren();
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.querySelector(tagName);
}

function bubble(tooltip) {
  return tooltip.shadowRoot.querySelector('[part~="bubble"]');
}

function isOpen(tooltip) {
  return bubble(tooltip).matches(":popover-open");
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** A tooltip on an icon-only native button, with a plain button after it. */
const iconButton = (attributes = 'label="Delete row"') =>
  `<${tagName} ${attributes}><button type="button"><svg width="16" height="16" aria-hidden="true"></svg></button></${tagName}>
   <button type="button" id="after">After</button>`;

describe("DsTooltip", () => {
  test("[label-names-trigger] names the trigger from the label, and the open bubble is not read again", async () => {
    const tooltip = render(iconButton());
    await userEvent.tab();
    expect(isOpen(tooltip)).toBe(true);

    const named = (await exposedNodes()).filter((node) => node.name === "Delete row");
    const text = (await exposedNodes()).filter(
      (node) => node.role === "StaticText" && node.name.includes("Delete row"),
    );

    expect(named).toEqual([{ role: "button", name: "Delete row" }]);
    expect(text).toEqual([]);
  });

  test("[label-names-trigger] names a design system Button through its accessible name", async () => {
    const tooltip = render(
      `<${tagName} label="Edit profile"><${buttonTag} variant="tertiary"><svg width="16" height="16" aria-hidden="true"></svg></${buttonTag}></${tagName}>`,
    );

    expect(await exposedNodes()).toContainEqual({ role: "button", name: "Edit profile" });

    tooltip.label = "Edit account";

    expect(await exposedNodes()).toContainEqual({ role: "button", name: "Edit account" });
  });

  test("[one-trigger] names only the first control, and gives a replaced trigger its own name back", async () => {
    const tooltip = render(
      `<${tagName} label="Delete row"><button type="button" aria-label="Old name"></button><button type="button" aria-label="Second"></button></${tagName}>`,
    );
    const [first, second] = tooltip.querySelectorAll("button");

    expect(await exposedNodes()).toContainEqual({ role: "button", name: "Delete row" });
    expect(await exposedNodes()).toContainEqual({ role: "button", name: "Second" });

    first.remove();
    await wait(0);

    expect(first.getAttribute("aria-label")).toBe("Old name");
    expect(second.getAttribute("aria-label")).toBe("Delete row");
  });

  test("[opens-on-hover-and-focus] opens after the pointer rests on the trigger", async () => {
    const tooltip = render(iconButton());
    expectRendered(tooltip, "trigger", "bubble");

    await userEvent.hover(tooltip.querySelector("button"));
    expect(isOpen(tooltip), "not at once").toBe(false);

    await expect.poll(() => isOpen(tooltip)).toBe(true);
  });

  test("[opens-on-hover-and-focus] opens at once on keyboard focus, and not on a pointer click", async () => {
    const tooltip = render(iconButton());

    await userEvent.tab();
    expect(isOpen(tooltip)).toBe(true);

    await userEvent.tab();
    expect(isOpen(tooltip)).toBe(false);

    tooltip.querySelector("button").focus({ focusVisible: false });
    await userEvent.click(tooltip.querySelector("button"));
    await wait(PAST_DELAY);
    expect(isOpen(tooltip), "a click closes it and it stays closed").toBe(false);
  });

  test("[stays-while-hovered] stays open while the pointer moves from the trigger onto the bubble", async () => {
    const tooltip = render(iconButton());

    await userEvent.hover(tooltip.querySelector("button"));
    await expect.poll(() => isOpen(tooltip)).toBe(true);

    await userEvent.hover(bubble(tooltip));
    await wait(PAST_DELAY);

    expect(isOpen(tooltip)).toBe(true);
  });

  test("[escape-closes] Escape closes the bubble, keeps focus, and it stays closed until focus returns", async () => {
    const tooltip = render(iconButton());
    const trigger = tooltip.querySelector("button");

    await userEvent.tab();
    expect(isOpen(tooltip)).toBe(true);

    await userEvent.keyboard("{Escape}");
    expect(isOpen(tooltip)).toBe(false);
    expect(document.activeElement).toBe(trigger);

    await userEvent.hover(trigger);
    await wait(PAST_DELAY);
    expect(isOpen(tooltip), "hovering after Escape").toBe(false);

    await userEvent.hover(document.querySelector("#after"));
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect(isOpen(tooltip), "focus came back").toBe(true);
  });

  test("[escape-closes] Escape closes only the bubble when the tooltip is inside a dialog", async () => {
    document.body.innerHTML = `<${dialogTag} label="Edit rows" open>${iconButton()}</${dialogTag}>`;
    const dialog = document.body.querySelector(dialogTag);
    const tooltip = dialog.querySelector(tagName);
    tooltip.querySelector("button").focus();
    expect(isOpen(tooltip)).toBe(true);

    await userEvent.keyboard("{Escape}");

    expect(isOpen(tooltip)).toBe(false);
    expect(dialog.open).toBe(true);
  });

  test("[closes-on-leave] closes when the pointer leaves, when focus leaves, and when the trigger is activated", async () => {
    const tooltip = render(iconButton());
    const trigger = tooltip.querySelector("button");

    await userEvent.hover(trigger);
    await expect.poll(() => isOpen(tooltip)).toBe(true);
    await userEvent.hover(document.querySelector("#after"));
    await expect.poll(() => isOpen(tooltip), "pointer left").toBe(false);

    await userEvent.tab();
    expect(isOpen(tooltip)).toBe(true);
    await userEvent.tab();
    expect(isOpen(tooltip), "focus left").toBe(false);

    await userEvent.tab({ shift: true });
    expect(isOpen(tooltip)).toBe(true);
    await userEvent.keyboard("{Enter}");
    expect(isOpen(tooltip), "trigger activated").toBe(false);
  });

  test("[not-interactive] the bubble holds nothing focusable and Tab moves past it", async () => {
    const tooltip = render(iconButton());
    expectRendered(tooltip, "bubble");

    await userEvent.tab();
    expect(isOpen(tooltip)).toBe(true);
    expect(bubble(tooltip).querySelector("a, button, input, select, textarea, [tabindex]")).toBe(
      null,
    );

    await userEvent.tab();

    expect(document.activeElement).toBe(document.querySelector("#after"));
  });

  test("[stays-in-view] moves below the trigger when there is no room above", async () => {
    const tooltip = render(iconButton());
    tooltip.style.cssText = "position: fixed; top: 0; left: 50%";

    await userEvent.tab();
    const trigger = tooltip.querySelector("button").getBoundingClientRect();
    const box = bubble(tooltip).getBoundingClientRect();

    expect(box.top).toBeGreaterThanOrEqual(trigger.bottom);
    expect(box.top).toBeGreaterThanOrEqual(0);
  });

  test("[stays-in-view] shows above or below as placement says when there is room", async () => {
    const tooltip = render(iconButton('label="Delete row" placement="below"'));
    tooltip.style.cssText = "position: fixed; top: 200px; left: 200px";

    await userEvent.tab();
    let trigger = tooltip.querySelector("button").getBoundingClientRect();
    expect(bubble(tooltip).getBoundingClientRect().top).toBeGreaterThanOrEqual(trigger.bottom);

    await userEvent.tab();
    tooltip.placement = "above";
    await userEvent.tab({ shift: true });
    trigger = tooltip.querySelector("button").getBoundingClientRect();
    expect(bubble(tooltip).getBoundingClientRect().bottom).toBeLessThanOrEqual(trigger.top);
  });

  test("[stays-in-view] stays inside the viewport at its edge and is not clipped by a scrolling container", async () => {
    document.body.innerHTML = `<div style="position: fixed; top: 100px; right: 0; width: 40px; height: 40px; overflow: hidden">
      ${iconButton('label="Remove this row and every row below it"')}</div>`;
    const tooltip = document.body.querySelector(tagName);

    await userEvent.tab();
    const box = bubble(tooltip).getBoundingClientRect();
    const clip = document.body.firstElementChild.getBoundingClientRect();

    expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.width, "wider than the clipping container").toBeGreaterThan(clip.width);
    expect(document.elementFromPoint(box.left + 2, box.top + box.height / 2)).toBe(tooltip);
  });

  test("[does-not-shift-layout] opening the bubble moves and resizes nothing", async () => {
    const tooltip = render(iconButton());
    const trigger = tooltip.querySelector("button");
    const after = document.querySelector("#after");
    const before = [trigger, after, tooltip].map((element) =>
      JSON.stringify(element.getBoundingClientRect()),
    );

    await userEvent.tab();
    expect(isOpen(tooltip)).toBe(true);

    expect(
      [trigger, after, tooltip].map((element) => JSON.stringify(element.getBoundingClientRect())),
    ).toEqual(before);
  });

  test("only one bubble is open at a time", async () => {
    document.body.innerHTML = `${iconButton('label="One"')}${iconButton('label="Two"')}`;
    const [one, two] = document.querySelectorAll(tagName);

    await userEvent.tab();
    expect(isOpen(one)).toBe(true);
    two.querySelector("button").focus();

    expect(isOpen(two)).toBe(true);
    expect(isOpen(one)).toBe(false);
  });

  test("the bubble shows the label and reads its tokens", async () => {
    const tooltip = render(iconButton());
    await userEvent.tab();
    const style = getComputedStyle(bubble(tooltip));

    expect(bubble(tooltip).textContent).toBe("Delete row");
    expect(style.backgroundColor).toBe(
      resolvedValue("background-color", "var(--ds-semantic-color-background-surface)"),
    );
    expect(style.borderTopColor).toBe(
      resolvedValue("border-top-color", "var(--ds-semantic-color-border-default)"),
    );
    expect(style.boxShadow).toBe(resolvedValue("box-shadow", "var(--ds-semantic-elevation-md)"));
    expect(style.fontSize).toBe(
      resolvedValue("font-size", "var(--ds-semantic-typography-label-sm-font-size)"),
    );
  });
});
