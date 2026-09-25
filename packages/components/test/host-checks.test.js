/**
 * Host-binding guarantees, checked once for every web-component binding in the
 * catalog: alias registration, the native `hidden` attribute, focus forwarding
 * to `host.focus.forwardsTo`, visible keyboard focus, binding events reaching
 * the host, enum properties, and properties set before registration. A
 * component's own test file covers only its behavior.
 *
 * The rule census credits a tag in a title here to every component whose
 * contract has that rule, so the visible-focus title carries
 * `[a11y-visible-focus]`.
 */
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { commands, userEvent } from "vitest/browser";

import { FIXTURES } from "./helpers/fixtures.js";

const elements = await commands.hostElements();
const modules = new Map();
const rows = (list) => list.map((element) => [element.tagName, element]);
const focusable = elements.filter((element) => element.focusPart);

beforeAll(async () => {
  for (const element of elements) {
    const module = await import(`../src/${element.slug}.js`);
    module[element.defineExport](testTag(element));
    modules.set(element.id, module);
  }
});

afterEach(() => {
  document.body.replaceChildren();
});

function testTag(element, suffix = "") {
  return `host-${element.tagName}${suffix}`;
}

function render(element, attributes = {}) {
  const host = document.createElement(testTag(element));
  for (const [name, value] of Object.entries({ ...FIXTURES[element.id], ...attributes })) {
    host.setAttribute(name, value);
  }
  host.textContent = "Label";
  document.body.append(host);
  return host;
}

function focusTarget(element, host) {
  return host.shadowRoot.querySelector(`[part="${element.focusPart}"]`);
}

/** Fire a binding event the way a user would, from its native control. */
async function trigger(event, target) {
  if (event === "click" || target.type === "checkbox") {
    await userEvent.click(target);
    return;
  }
  await userEvent.type(target, "a");
  if (event === "change") await userEvent.tab();
}

describe("host checks", () => {
  test.each(rows(elements.filter((element) => element.supportsAliases)))(
    "<%s> can be registered under more than one tag name",
    (_tagName, element) => {
      const module = modules.get(element.id);
      const define = module[element.defineExport];
      const alias = testTag(element, "-alias");

      expect(() => define(alias)).not.toThrow();
      expect(customElements.get(alias)).toBeDefined();
      expect(document.createElement(alias)).toBeInstanceOf(module[element.className]);
      expect(() => define(alias)).not.toThrow();
    },
  );

  test.each(rows(elements))("<%s> honors the native hidden attribute", (_tagName, element) => {
    const host = render(element, { hidden: "" });

    expect(getComputedStyle(host).display).toBe("none");
  });

  test.each(rows(focusable))(
    "<%s> forwards focus() and blur() to its focus target",
    (_tagName, element) => {
      const host = render(element);
      const target = focusTarget(element, host);

      host.focus();
      expect(host.shadowRoot.activeElement).toBe(target);
      host.blur();
      expect(host.shadowRoot.activeElement).toBe(null);
    },
  );

  test.each(rows(focusable))(
    "[a11y-visible-focus] <%s> shows a focus outline when reached by keyboard",
    async (_tagName, element) => {
      const host = render(element);
      const target = focusTarget(element, host);

      await userEvent.tab();

      expect(host.shadowRoot.activeElement).toBe(target);
      expect(target.matches(":focus-visible")).toBe(true);
      expect(getComputedStyle(target).outlineStyle).not.toBe("none");
      expect(parseFloat(getComputedStyle(target).outlineWidth)).toBeGreaterThan(0);
    },
  );

  const events = focusable.flatMap((element) =>
    element.events.map((event) => [element.tagName, event, element]),
  );

  test.each(events)("<%s> dispatches %s on the host", async (_tagName, event, element) => {
    const host = render(element);
    const received = [];
    host.addEventListener(event, (dispatched) => received.push(dispatched.target));

    await trigger(event, focusTarget(element, host));

    expect(received).toContain(host);
  });

  test("every component with events has a focus target to fire them from", () => {
    const uncovered = elements
      .filter((element) => element.events.length > 0 && !element.focusPart)
      .map((element) => element.id);

    expect(uncovered).toEqual([]);
  });

  test("every component with a visible-focus rule has a focus target", () => {
    const uncovered = elements
      .filter((element) => element.ruleIds.includes("a11y-visible-focus"))
      .filter((element) => !element.focusPart)
      .map((element) => element.id);

    expect(uncovered).toEqual([]);
  });

  const enums = elements.flatMap((element) =>
    element.enums.map((entry) => [element.tagName, entry.property, element, entry]),
  );

  test.each(enums)(
    "<%s> %s returns each contract value and falls back to the contract default",
    (_tagName, _property, element, { attribute, property, values, default: fallback }) => {
      const host = render(element);

      for (const value of values) {
        host.setAttribute(attribute, value);
        expect(host[property], value).toBe(value);
      }
      host.setAttribute(attribute, "not-a-contract-value");
      expect(host[property]).toBe(fallback);
      host.removeAttribute(attribute);
      expect(host[property]).toBe(fallback);
    },
  );

  /**
   * Create and connect the element while its tag is still undefined, set every
   * mapped property on the plain HTMLElement, then register it. Each case uses
   * its own tag because a definition cannot be undone.
   */
  test.each(rows(elements))(
    "<%s> keeps properties set before registration",
    (_tagName, element) => {
      const tagName = testTag(element, "-upgrade");
      const host = document.createElement(tagName);
      for (const [name, value] of Object.entries(FIXTURES[element.id] ?? {})) {
        host.setAttribute(name, value);
      }
      Object.assign(host, element.properties);
      document.body.append(host);

      modules.get(element.id)[element.defineExport](tagName);

      for (const [property, value] of Object.entries(element.properties)) {
        expect(Object.hasOwn(host, property), `${property} is an own property`).toBe(false);
        expect(host[property], property).toBe(value);
      }
    },
  );
});
