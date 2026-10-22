/**
 * Host behavior shared by every component, driven by the table below: alias
 * registration, the native `hidden` attribute, rendered parts and the default
 * slot, focus forwarding, visible keyboard focus, events reaching the host and
 * not firing while disabled, keyboard activation, the `form` property, enum
 * properties, and properties set before registration. A component's own test
 * file covers only its behavior. Add a row when adding a component; a test
 * fails when a component in src/ has no row.
 */
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";

const ELEMENTS = [
  {
    id: "spinner",
    tagName: "ds-spinner",
    className: "DsSpinner",
    defineExport: "defineSpinner",
    events: [],
    // TODO: the part that takes focus, or null when nothing does.
    focusPart: null,
    // TODO: the shadow parts it renders. These are the spec's anatomy names.
    parts: ["indicator"],
    requiresDefaultSlot: false,
    disabledAttribute: null,
    fieldsetDisables: false,
    hasFormProperty: false,
    activationKeys: [],
    fixture: {},
    textAttributes: {},
    enums: [
      {
        attribute: "size",
        property: "size",
        values: ["inherit", "small", "medium", "large"],
        default: "inherit",
      },
    ],
    properties: { label: "sample label", size: "small" },
  },
  {
    id: "avatar",
    tagName: "ds-avatar",
    className: "DsAvatar",
    defineExport: "defineAvatar",
    events: [],
    focusPart: null,
    parts: ["surface", "image", "initials", "placeholder"],
    requiresDefaultSlot: false,
    disabledAttribute: null,
    fieldsetDisables: false,
    hasFormProperty: false,
    activationKeys: [],
    fixture: {},
    textAttributes: {},
    enums: [
      {
        attribute: "size",
        property: "size",
        values: ["small", "medium", "large"],
        default: "medium",
      },
    ],
    properties: { name: "sample name", image: "sample image", size: "small", decorative: true },
  },
  {
    id: "progress-bar",
    tagName: "ds-progress-bar",
    className: "DsProgressBar",
    defineExport: "defineProgressBar",
    events: [],
    focusPart: null,
    parts: ["label", "track", "fill"],
    requiresDefaultSlot: false,
    disabledAttribute: null,
    fieldsetDisables: false,
    hasFormProperty: false,
    activationKeys: [],
    fixture: {},
    textAttributes: {},
    enums: [],
    properties: { label: "sample label", value: 40, max: 80 },
  },
  {
    id: "card",
    tagName: "ds-card",
    className: "DsCard",
    defineExport: "defineCard",
    events: ["click"],
    focusPart: "title-link",
    // The ring surrounds the whole card, not the title link.
    focusRingPart: "surface",
    parts: ["surface", "media", "title", "body", "actions"],
    requiresDefaultSlot: true,
    disabledAttribute: null,
    fieldsetDisables: false,
    hasFormProperty: false,
    activationKeys: ["Enter"],
    fixture: { href: "#fixture", label: "Sample label" },
    textAttributes: { href: "#fixture", label: "Sample label" },
    enums: [],
    properties: { label: "sample label", href: "sample href", headingLevel: 4 },
  },
  {
    // toggle needs a section to expand, so toggle events have their own tests.
    id: "accordion",
    tagName: "ds-accordion",
    className: "DsAccordion",
    defineExport: "defineAccordion",
    events: [],
    focusPart: "trigger",
    parts: ["section", "trigger", "indicator", "panel"],
    requiresDefaultSlot: false,
    disabledAttribute: null,
    fieldsetDisables: false,
    hasFormProperty: false,
    activationKeys: [],
    fixture: {},
    fixtureContent:
      '<ds-accordion-section label="One">One</ds-accordion-section><ds-accordion-section label="Two">Two</ds-accordion-section>',
    textAttributes: {},
    enums: [],
    properties: { exclusive: true, headingLevel: 4 },
  },
  {
    id: "text-area",
    tagName: "ds-text-area",
    className: "DsTextArea",
    defineExport: "defineTextArea",
    events: ["change"],
    focusPart: "control",
    parts: ["field", "label", "control", "hint", "error"],
    requiresDefaultSlot: false,
    disabledAttribute: "disabled",
    fieldsetDisables: true,
    hasFormProperty: true,
    activationKeys: [],
    fixture: {},
    textAttributes: { label: "Sample label", hint: "Sample hint", error: "Sample error" },
    enums: [],
    properties: {
      label: "sample label",
      hint: "sample hint",
      error: "sample error",
      name: "notes",
      value: "sample value",
      placeholder: "sample placeholder",
      autocomplete: "off",
      rows: 6,
      readonly: true,
      disabled: true,
      required: true,
    },
  },
  {
    id: "select",
    tagName: "ds-select",
    className: "DsSelect",
    defineExport: "defineSelect",
    events: ["change"],
    focusPart: "control",
    parts: ["field", "label", "control", "hint", "error"],
    requiresDefaultSlot: false,
    disabledAttribute: "disabled",
    fieldsetDisables: true,
    hasFormProperty: true,
    activationKeys: [],
    fixture: {},
    fixtureContent: '<option value="one">One</option><option value="two">Two</option>',
    textAttributes: { label: "Sample label", hint: "Sample hint", error: "Sample error" },
    enums: [],
    properties: {
      label: "sample label",
      hint: "sample hint",
      error: "sample error",
      name: "choice",
      value: "two",
      disabled: true,
      required: true,
    },
  },
  {
    id: "switch",
    tagName: "ds-switch",
    className: "DsSwitch",
    defineExport: "defineSwitch",
    events: ["change"],
    focusPart: "control",
    parts: ["field", "choice", "control", "indicator", "label", "hint", "error"],
    requiresDefaultSlot: false,
    disabledAttribute: "disabled",
    fieldsetDisables: true,
    hasFormProperty: true,
    activationKeys: ["Space"],
    fixture: {},
    textAttributes: { label: "Sample label", hint: "Sample hint", error: "Sample error" },
    enums: [],
    properties: {
      label: "sample label",
      hint: "sample hint",
      error: "sample error",
      checked: true,
      name: "setting",
      value: "enabled",
      disabled: true,
    },
  },
  {
    id: "radio-group",
    tagName: "ds-radio-group",
    className: "DsRadioGroup",
    defineExport: "defineRadioGroup",
    events: ["change"],
    focusPart: "control",
    parts: ["field", "label", "options", "choice", "control", "indicator", "hint", "error"],
    requiresDefaultSlot: false,
    disabledAttribute: "disabled",
    fieldsetDisables: true,
    hasFormProperty: true,
    activationKeys: ["Space"],
    fixture: {},
    fixtureContent: '<option value="one">One</option><option value="two">Two</option>',
    textAttributes: { label: "Sample label", hint: "Sample hint", error: "Sample error" },
    enums: [],
    properties: {
      label: "sample label",
      hint: "sample hint",
      error: "sample error",
      name: "choice",
      value: "two",
      disabled: true,
      required: true,
    },
  },
  {
    // change needs a second tab to choose, so selection events have their own tests.
    id: "tabs",
    tagName: "ds-tabs",
    className: "DsTabs",
    defineExport: "defineTabs",
    events: [],
    focusPart: "tab",
    parts: ["tab-list", "tab", "selected-indicator", "panel"],
    requiresDefaultSlot: true,
    disabledAttribute: null,
    fieldsetDisables: false,
    hasFormProperty: false,
    activationKeys: [],
    fixture: {},
    fixtureContent:
      '<ds-tab-panel label="One" value="one">One</ds-tab-panel><ds-tab-panel label="Two" value="two">Two</ds-tab-panel>',
    textAttributes: { label: "Sample label" },
    enums: [],
    properties: { label: "sample label", value: "two" },
  },
  {
    // Modal focus containment and restoration need their own open/close fixtures.
    id: "dialog",
    tagName: "ds-dialog",
    className: "DsDialog",
    defineExport: "defineDialog",
    events: [],
    focusPart: null,
    parts: ["dialog", "title", "description", "content", "actions"],
    requiresDefaultSlot: true,
    disabledAttribute: null,
    fieldsetDisables: false,
    hasFormProperty: false,
    activationKeys: [],
    fixture: {},
    textAttributes: { label: "Sample label", description: "Sample description" },
    enums: [],
    properties: { label: "sample label", description: "sample description", dismissible: false },
  },
  {
    // The dismiss control is optional, so dismissal and its focus have their own tests.
    id: "alert",
    tagName: "ds-alert",
    className: "DsAlert",
    defineExport: "defineAlert",
    events: [],
    focusPart: null,
    parts: ["surface", "icon", "title", "message", "actions", "dismiss"],
    requiresDefaultSlot: true,
    disabledAttribute: null,
    fieldsetDisables: false,
    hasFormProperty: false,
    activationKeys: [],
    fixture: {},
    textAttributes: { label: "Sample label", dismissible: "" },
    enums: [
      {
        attribute: "variant",
        property: "variant",
        values: ["info", "success", "warning", "danger"],
        default: "info",
      },
      {
        attribute: "announce",
        property: "announce",
        values: ["off", "polite", "urgent"],
        default: "off",
      },
    ],
    properties: {
      variant: "danger",
      label: "sample label",
      announce: "polite",
      dismissible: true,
      dismissLabel: "Close",
    },
  },
  {
    id: "badge",
    tagName: "ds-badge",
    className: "DsBadge",
    defineExport: "defineBadge",
    events: [],
    focusPart: null,
    parts: ["badge"],
    requiresDefaultSlot: true,
    disabledAttribute: null,
    fieldsetDisables: false,
    hasFormProperty: false,
    activationKeys: [],
    fixture: {},
    textAttributes: {},
    enums: [
      {
        attribute: "variant",
        property: "variant",
        values: ["default", "accent", "success", "danger", "warning", "info"],
        default: "default",
      },
    ],
    properties: { variant: "accent" },
  },
  {
    id: "button",
    tagName: "ds-button",
    className: "DsButton",
    defineExport: "defineButton",
    events: ["click"],
    focusPart: "button",
    parts: ["button"],
    requiresDefaultSlot: true,
    disabledAttribute: "disabled",
    fieldsetDisables: true,
    hasFormProperty: true,
    activationKeys: ["Enter", "Space"],
    fixture: {},
    textAttributes: {},
    enums: [
      {
        attribute: "variant",
        property: "variant",
        values: ["primary", "secondary", "tertiary", "destructive"],
        default: "primary",
      },
      { attribute: "size", property: "size", values: ["sm", "md"], default: "md" },
      {
        attribute: "type",
        property: "type",
        values: ["button", "submit", "reset"],
        default: "button",
      },
    ],
    properties: { variant: "destructive", size: "sm", type: "submit", disabled: true },
  },
  {
    id: "checkbox",
    tagName: "ds-checkbox",
    className: "DsCheckbox",
    defineExport: "defineCheckbox",
    events: ["change"],
    focusPart: "control",
    parts: ["field", "choice", "control", "indicator", "label", "hint", "error"],
    requiresDefaultSlot: false,
    disabledAttribute: "disabled",
    fieldsetDisables: true,
    hasFormProperty: true,
    activationKeys: ["Space"],
    fixture: {},
    textAttributes: { label: "Sample label", hint: "Sample hint", error: "Sample error" },
    enums: [],
    properties: {
      label: "sample label",
      hint: "sample hint",
      error: "sample error",
      checked: true,
      indeterminate: true,
      name: "sample name",
      value: "sample value",
      disabled: true,
      required: true,
    },
  },
  {
    id: "icon",
    tagName: "ds-icon",
    className: "DsIcon",
    defineExport: "defineIcon",
    events: [],
    focusPart: null,
    parts: ["icon"],
    requiresDefaultSlot: true,
    disabledAttribute: null,
    fieldsetDisables: false,
    hasFormProperty: false,
    activationKeys: [],
    fixture: {},
    textAttributes: {},
    enums: [
      {
        attribute: "size",
        property: "size",
        values: ["inherit", "small", "medium", "large"],
        default: "inherit",
      },
    ],
    properties: { label: "sample label", size: "large" },
  },
  {
    id: "link",
    tagName: "ds-link",
    className: "DsLink",
    defineExport: "defineLink",
    events: ["click"],
    focusPart: "link",
    parts: ["link"],
    requiresDefaultSlot: true,
    disabledAttribute: null,
    fieldsetDisables: false,
    hasFormProperty: false,
    activationKeys: ["Enter"],
    fixture: { href: "#fixture" },
    textAttributes: { href: "#fixture" },
    enums: [
      {
        attribute: "variant",
        property: "variant",
        values: ["inline", "standalone"],
        default: "inline",
      },
    ],
    properties: { href: "#sample", variant: "standalone" },
  },
  {
    id: "text-field",
    tagName: "ds-text-field",
    className: "DsTextField",
    defineExport: "defineTextField",
    events: ["change"],
    focusPart: "control",
    parts: ["field", "label", "control", "hint", "error"],
    requiresDefaultSlot: false,
    disabledAttribute: "disabled",
    fieldsetDisables: true,
    hasFormProperty: true,
    activationKeys: [],
    fixture: {},
    textAttributes: { label: "Sample label", hint: "Sample hint", error: "Sample error" },
    enums: [
      {
        attribute: "type",
        property: "type",
        values: ["text", "email", "password", "search", "url", "tel"],
        default: "text",
      },
    ],
    properties: {
      label: "sample label",
      hint: "sample hint",
      error: "sample error",
      type: "email",
      name: "sample name",
      value: "sample value",
      placeholder: "sample placeholder",
      autocomplete: "email",
      disabled: true,
      required: true,
    },
  },
];

const elements = ELEMENTS;
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
