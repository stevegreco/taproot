/**
 * Host behavior shared by every component, driven by one row per component in
 * test/host-checks/<name>.js: alias registration, the native `hidden`
 * attribute, rendered parts and the default slot, focus forwarding, visible
 * keyboard focus, events reaching the host and not firing while disabled,
 * keyboard activation, the `form` property, enum properties, and properties
 * set before registration. A component's own test file covers only its
 * behavior. Add a row file when adding a component; a test fails when a
 * component in src/ has no row.
 */
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";

const elements = Object.values(
  import.meta.glob("./host-checks/*.js", { eager: true, import: "default" }),
);
const modules = new Map();
const rows = (list) => list.map((element) => [element.tagName, element]);
const focusable = elements.filter((element) => element.focusPart);

beforeAll(async () => {
  for (const element of elements) {
    const module = await import(`../src/${element.id}.js`);
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
  for (const [name, value] of Object.entries({ ...element.fixture, ...attributes })) {
    host.setAttribute(name, value);
  }
  if (element.fixtureContent) host.innerHTML = element.fixtureContent;
  else host.textContent = "Label";
  document.body.append(host);
  return host;
}

function focusTarget(element, host) {
  return host.shadowRoot.querySelector(`[part="${element.focusPart}"]`);
}

/**
 * Fire a web event the way a user would, from its native control. `force` skips the
 * actionability wait, so a disabled control can be tried.
 */
async function trigger(event, target, options = {}) {
  if (target.localName === "select") {
    if (target.disabled) {
      await userEvent.click(target, { force: true });
      await userEvent.keyboard("{ArrowDown}");
    } else await userEvent.selectOptions(target, "two");
    return;
  }
  if (event === "click" || target.type === "checkbox" || target.type === "radio") {
    await userEvent.click(target, options);
    return;
  }
  await userEvent.type(target, "a", options);
  if (event === "change") await userEvent.tab();
}

describe("host checks", () => {
  test("has a row for every component in src/", () => {
    const files = Object.keys(import.meta.glob(["../src/*.js", "!../src/index.js"]));
    const ids = files.map((file) => file.slice("../src/".length, -".js".length));
    expect(elements.map((element) => element.id).sort()).toEqual(ids.sort());
  });

  test.each(rows(elements))(
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
    "<%s> shows a focus outline when reached by keyboard",
    async (_tagName, element) => {
      const host = render(element);
      const target = focusTarget(element, host);

      const ring = element.focusRingPart
        ? host.shadowRoot.querySelector(`[part="${element.focusRingPart}"]`)
        : target;

      await userEvent.tab();

      expect(host.shadowRoot.activeElement).toBe(target);
      expect(target.matches(":focus-visible")).toBe(true);
      expect(getComputedStyle(ring).outlineStyle).not.toBe("none");
      expect(parseFloat(getComputedStyle(ring).outlineWidth)).toBeGreaterThan(0);
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

  test.each(rows(elements.filter((element) => element.parts.length > 0)))(
    "<%s> renders every documented part",
    (_tagName, element) => {
      const host = render(element, element.textAttributes);
      const missing = element.parts.filter(
        (part) => !host.shadowRoot.querySelector(`[part~="${part}"]`),
      );

      expect(missing).toEqual([]);
    },
  );

  test.each(rows(elements.filter((element) => element.requiresDefaultSlot)))(
    "<%s> renders its default slot",
    (_tagName, element) => {
      const host = render(element);

      expect(host.shadowRoot.querySelector("slot:not([name])")).not.toBe(null);
    },
  );

  const suppressed = focusable
    .filter((element) => element.disabledAttribute)
    .flatMap((element) => element.events.map((event) => [element.tagName, event, element]));

  test.each(suppressed)(
    "<%s> does not dispatch %s while disabled",
    async (_tagName, event, element) => {
      const host = render(element, { [element.disabledAttribute]: "" });
      const received = [];
      host.addEventListener(event, () => received.push(event));

      await trigger(event, focusTarget(element, host), { force: true });

      expect(received).toEqual([]);
    },
  );

  test.each(suppressed.filter(([, , element]) => element.fieldsetDisables))(
    "<%s> does not dispatch %s inside a disabled fieldset",
    async (_tagName, event, element) => {
      const fieldset = document.createElement("fieldset");
      fieldset.disabled = true;
      document.body.append(fieldset);
      const host = render(element);
      fieldset.append(host);
      const received = [];
      host.addEventListener(event, () => received.push(event));

      await trigger(event, focusTarget(element, host), { force: true });

      expect(received).toEqual([]);
    },
  );

  const keys = focusable
    .filter((element) => element.events.length > 0)
    .flatMap((element) => element.activationKeys.map((key) => [element.tagName, key, element]));

  test.each(keys)("<%s> activates with %s", async (_tagName, key, element) => {
    const host = render(element);
    const [event] = element.events;
    const received = [];
    host.addEventListener(event, () => received.push(event));

    focusTarget(element, host).focus();
    await userEvent.keyboard(key === "Space" ? " " : `{${key}}`);

    expect(received).toEqual([event]);
  });

  test.each(rows(elements.filter((element) => element.hasFormProperty)))(
    "<%s> form returns the form that owns it",
    (_tagName, element) => {
      const form = document.createElement("form");
      document.body.append(form);
      const host = render(element);
      form.append(host);

      expect(host.form).toBe(form);
      host.remove();
      expect(host.form).toBe(null);
    },
  );

  test("every component with events has a focus target to fire them from", () => {
    const uncovered = elements
      .filter((element) => element.events.length > 0 && !element.focusPart)
      .map((element) => element.id);

    expect(uncovered).toEqual([]);
  });

  const enums = elements.flatMap((element) =>
    element.enums.map((entry) => [element.tagName, entry.property, element, entry]),
  );

  test.each(enums)(
    "<%s> %s returns each supported value and falls back to its default",
    (_tagName, _property, element, { attribute, property, values, default: fallback }) => {
      const host = render(element);

      for (const value of values) {
        host.setAttribute(attribute, value);
        expect(host[property], value).toBe(value);
      }
      host.setAttribute(attribute, "not-a-supported-value");
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
      for (const [name, value] of Object.entries(element.fixture)) {
        host.setAttribute(name, value);
      }
      if (element.fixtureContent) host.innerHTML = element.fixtureContent;
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
