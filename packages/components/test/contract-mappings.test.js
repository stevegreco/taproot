/**
 * Every compiled mapping applies where the contract says: for each component,
 * configuration, and state, each part's computed value for each channel equals
 * the token the contract resolves there, in light and dark themes.
 *
 * States are forced, not reached with the pointer: hover, pressed, and
 * focus-visible through CDP pseudo-state forcing on the focus target; states
 * named after a boolean parameter (disabled, checked) and invalid through host
 * attributes. The pointer is parked away from the cases first, so a pointer an
 * earlier test file left over a control cannot add a real hover. Literals
 * (`transparent`, `inherit`, `none`) are compared as computed values.
 */
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { cdp, commands, userEvent } from "vitest/browser";

import { FIXTURES } from "./helpers/fixtures.js";

const PSEUDO_STATES = Object.freeze({
  hover: "hover",
  pressed: "active",
  "focus-visible": "focus-visible",
});

/** CSS property set on the probe, then the longhands read from part and probe. */
const CHANNELS = Object.freeze({
  background: ["background-color", ["background-color"]],
  foreground: ["color", ["color"]],
  border: [
    "border-color",
    ["border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
  ],
  outline: ["outline-color", ["outline-color"]],
  "padding-inline": ["padding-inline", ["padding-inline-start", "padding-inline-end"]],
  "padding-block": ["padding-block", ["padding-block-start", "padding-block-end"]],
  radius: ["border-radius", ["border-top-left-radius", "border-bottom-right-radius"]],
  gap: ["gap", ["row-gap", "column-gap"]],
  "font-family": ["font-family", ["font-family"]],
  "font-size": ["font-size", ["font-size"]],
  "font-weight": ["font-weight", ["font-weight"]],
  "line-height": ["line-height", ["line-height"]],
  "letter-spacing": ["letter-spacing", ["letter-spacing"]],
  transition: [
    "transition",
    ["transition-property", "transition-duration", "transition-timing-function"],
  ],
  "transition-duration": ["transition-duration", ["transition-duration"]],
  "transition-timing-function": ["transition-timing-function", ["transition-timing-function"]],
});

/** Distinct inherited type, so `inherit` cannot pass by matching a token by accident. */
const CONTAINER_STYLE = "font: 700 23px/41px serif; letter-spacing: 3px; color: rgb(1, 2, 3)";

const THEMES = ["light", "dark"];

const components = await commands.contractCases();
const session = cdp();

beforeAll(async () => {
  await session.send("DOM.enable");
  await session.send("CSS.enable");
  await parkPointer();
});

afterEach(async () => {
  document.body.replaceChildren();
  await session.send("Emulation.setEmulatedMedia", { features: [] });
});

afterAll(() => {
  document.documentElement.dataset.theme = "light";
});

describe.each(components.map((component) => [component.id, component]))(
  "%s mappings",
  (id, component) => {
    const tagName = `contract-ds-${component.slug}`;

    beforeAll(async () => {
      const module = await import(`../src/${component.slug}.js`);
      module[component.defineExport](tagName);
    });

    test("apply per configuration and state in every theme", async () => {
      const mismatches = [];
      for (const theme of THEMES) {
        document.documentElement.dataset.theme = theme;
        for (const testCase of component.cases) {
          mismatches.push(...(await checkCase(component, tagName, testCase, theme)));
        }
      }
      expect(mismatches).toEqual([]);
    });
  },
);

/** Moves the pointer to the bottom edge of the viewport, below every rendered case. */
async function parkPointer() {
  const parking = document.createElement("div");
  parking.setAttribute("style", "position: fixed; inset: auto 0 0; height: 8px");
  document.body.append(parking);
  await userEvent.hover(parking);
  parking.remove();
}

async function checkCase(component, tagName, testCase, theme) {
  const where = `${component.id} ${describeConfiguration(testCase.configuration)} ${describeStates(testCase.states)} theme=${theme}`;
  if (testCase.problems.length > 0)
    return testCase.problems.map((problem) => `${where}: ${problem}`);

  await session.send("Emulation.setEmulatedMedia", { features: testCase.media });
  const host = render(component, tagName, testCase);

  const pseudo = testCase.states.filter((state) => PSEUDO_STATES[state]);
  if (pseudo.length > 0) {
    if (!component.focusPart) return [`${where}: pseudo states need a binding focus target`];
    await forcePseudoStates(
      partElement(component, host, component.focusPart),
      pseudo.map((state) => PSEUDO_STATES[state]),
    );
  }

  const mismatches = [];
  for (const { part, channel, value } of testCase.expected) {
    const element = partElement(component, host, part);
    if (!element) {
      mismatches.push(`${where}: part ${part} is not rendered`);
      continue;
    }
    const [setProperty, longhands] = CHANNELS[channel];
    settleTransitions(element);
    const expected = probe(element, setProperty, value, longhands);
    const actual = computed(element, longhands);
    for (const longhand of longhands) {
      if (!sameValue(longhand, actual[longhand], expected[longhand])) {
        mismatches.push(
          `${where}: ${part} ${channel} (${longhand}) is ${actual[longhand]}, expected ${expected[longhand]} from ${value}`,
        );
      }
    }
  }

  host.parentElement.remove();
  return mismatches;
}

function render(component, tagName, testCase) {
  const container = document.createElement("div");
  container.setAttribute("style", CONTAINER_STYLE);
  const host = document.createElement(tagName);
  const attributes = { ...FIXTURES[component.id], ...testCase.attributes };
  for (const state of testCase.states) {
    const driver = component.stateAttributes[state];
    if (driver) attributes[driver.name] = driver.value;
    else if (!PSEUDO_STATES[state]) throw new Error(`${component.id} has no driver for ${state}`);
  }
  for (const [name, value] of Object.entries(attributes)) host.setAttribute(name, value);
  host.textContent = "Label";
  container.append(host);
  document.body.append(container);
  return host;
}

function partElement(component, host, part) {
  return host.shadowRoot.querySelector(`[part="${component.parts[part]}"]`);
}

/**
 * Resolve `value` on a sibling of the part, so `inherit` sees the same parent.
 * The probe takes the part's font size, so relative values (a unitless line
 * height, em letter spacing) resolve against the same size.
 */
function probe(element, property, value, longhands) {
  const probeElement = document.createElement("div");
  if (property !== "font-size") probeElement.style.fontSize = getComputedStyle(element).fontSize;
  probeElement.style.setProperty(property, value);
  element.parentNode.append(probeElement);
  const style = getComputedStyle(probeElement);
  const values = Object.fromEntries(longhands.map((name) => [name, style.getPropertyValue(name)]));
  probeElement.remove();
  return values;
}

function computed(element, longhands) {
  const style = getComputedStyle(element);
  return Object.fromEntries(longhands.map((name) => [name, style.getPropertyValue(name)]));
}

/**
 * Forcing a state starts real CSS transitions; jump them to their end values.
 * getAnimations() flushes pending style first, so it sees those transitions.
 */
function settleTransitions(element) {
  for (const animation of element.getAnimations()) animation.finish();
}

/**
 * A part's transition lists repeat one value per transitioned property, so every
 * item must equal the single value the probe resolves.
 */
function sameValue(longhand, actual, expected) {
  if (!longhand.startsWith("transition-")) return actual === expected;
  return splitList(actual).every((item) => item === expected);
}

function splitList(value) {
  const items = [];
  let depth = 0;
  let current = "";
  for (const character of value) {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      items.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  items.push(current.trim());
  return items;
}

/**
 * Force pseudo-classes on an element in this test's frame. CDP evaluates in the
 * top frame, so the element is found through a one-time key on this window.
 */
async function forcePseudoStates(element, forcedPseudoClasses) {
  const key = `__dsForce${crypto.randomUUID().replaceAll("-", "")}`;
  window[key] = element;
  try {
    await session.send("DOM.getDocument", { depth: 0 });
    const { result } = await session.send("Runtime.evaluate", {
      expression: `(function find(w) {
        try { if (w[${JSON.stringify(key)}]) return w[${JSON.stringify(key)}]; } catch {}
        for (let i = 0; i < w.frames.length; i++) { const hit = find(w.frames[i]); if (hit) return hit; }
      })(window)`,
    });
    if (!result.objectId) throw new Error("could not locate the element through CDP");
    const { nodeId } = await session.send("DOM.requestNode", { objectId: result.objectId });
    await session.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses });
  } finally {
    delete window[key];
  }
}

function describeConfiguration(configuration) {
  const entries = Object.entries(configuration);
  return entries.length === 0
    ? "configuration=none"
    : entries.map(([key, value]) => `${key}=${value}`).join(",");
}

function describeStates(states) {
  return states.length === 0 ? "state=rest" : `state=${states.join("+")}`;
}
