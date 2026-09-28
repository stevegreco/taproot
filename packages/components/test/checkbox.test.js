import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { cdp, userEvent } from "vitest/browser";

import { defineButton } from "../src/button.js";
import { defineCheckbox } from "../src/checkbox.js";

const tagName = "test-ds-checkbox";
const buttonTag = "test-ds-checkbox-button";

beforeAll(() => {
  defineCheckbox(tagName);
  defineButton(buttonTag);
});

afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.firstElementChild;
}

function controlOf(checkbox) {
  return checkbox.shadowRoot.querySelector("input");
}

function shown(checkbox, selector) {
  return getComputedStyle(checkbox.shadowRoot.querySelector(selector)).display !== "none";
}

function recordEvents(checkbox) {
  const events = [];
  for (const type of ["input", "change"]) {
    checkbox.addEventListener(type, (event) => events.push(`${type}:${event.target === checkbox}`));
  }
  return events;
}

describe("DsCheckbox", () => {
  test("[a11y-visible-label][a11y-invalid-message][a11y-required] associates the label, hint, error, and required state", () => {
    const checkbox = render(`
      <${tagName}
        label="I agree to the terms"
        hint="You can withdraw at any time."
        error="Agree to the terms to continue."
        required
      ></${tagName}>
    `);
    const input = controlOf(checkbox);
    const label = checkbox.shadowRoot.querySelector("label");
    const mark = checkbox.shadowRoot.querySelector(".required");

    expect(input.type).toBe("checkbox");
    expect(input.labels).toContain(label);
    expect(label.textContent).toContain("I agree to the terms");
    expect(mark.hidden).toBe(false);
    expect(mark.getAttribute("aria-hidden")).toBe("true");
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-describedby")).toBe("hint error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(checkbox.shadowRoot.querySelector("#error").textContent).toBe(
      "Agree to the terms to continue.",
    );
  });

  test("[a11y-visible-label] clicking the label toggles the checkbox", async () => {
    const checkbox = render(`<${tagName} label="Email me updates"></${tagName}>`);

    await userEvent.click(checkbox.shadowRoot.querySelector("label"));
    expect(checkbox.checked).toBe(true);
  });

  test("[a11y-described-by][error-marks-invalid] describes only the messages that have text", () => {
    const checkbox = render(`<${tagName} label="Updates" hint="Weekly"></${tagName}>`);
    const input = controlOf(checkbox);

    expect(input.getAttribute("aria-describedby")).toBe("hint");
    expect(input.hasAttribute("aria-invalid")).toBe(false);

    checkbox.hint = "";
    expect(input.hasAttribute("aria-describedby")).toBe(false);

    checkbox.error = "Choose an option.";
    expect(input.getAttribute("aria-describedby")).toBe("error");
    expect(input.getAttribute("aria-invalid")).toBe("true");

    checkbox.error = "";
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });

  test("[toggle-on-activate] clicking the box or pressing Space toggles and fires input then change from the host", async () => {
    const checkbox = render(`<${tagName} label="Updates"></${tagName}>`);
    const events = recordEvents(checkbox);

    await userEvent.click(controlOf(checkbox));
    expect(checkbox.checked).toBe(true);
    expect(events).toEqual(["input:true", "change:true"]);

    events.length = 0;
    await userEvent.keyboard(" ");
    expect(checkbox.checked).toBe(false);
    expect(events).toEqual(["input:true", "change:true"]);
  });

  test("[indeterminate-clears-on-activate][a11y-mixed-state] exposes mixed, then activation clears it and toggles checked", async () => {
    const checkbox = render(`<${tagName} label="All projects" indeterminate></${tagName}>`);
    const input = controlOf(checkbox);

    expect(input.indeterminate).toBe(true);
    expect(input.matches(":indeterminate")).toBe(true);
    expect(checkbox.checked).toBe(false);

    await userEvent.click(input);
    expect(checkbox.checked).toBe(true);
    expect(checkbox.indeterminate).toBe(false);
    expect(checkbox.hasAttribute("indeterminate")).toBe(false);
    expect(input.indeterminate).toBe(false);
  });

  test("[indeterminate-not-a-value] indeterminate changes neither checked nor the submitted value", () => {
    const form = render(`
      <form>
        <${tagName} label="All" name="all" value="yes" checked></${tagName}>
      </form>
    `);
    const checkbox = form.querySelector(tagName);

    checkbox.indeterminate = true;
    expect(checkbox.checked).toBe(true);
    expect(new FormData(form).get("all")).toBe("yes");

    checkbox.checked = false;
    expect(checkbox.indeterminate).toBe(true);
    expect(new FormData(form).has("all")).toBe(false);
  });

  test("[programmatic-no-events] setting checked or indeterminate from script fires no events", () => {
    const checkbox = render(`<${tagName} label="Updates"></${tagName}>`);
    const events = recordEvents(checkbox);

    checkbox.checked = true;
    checkbox.indeterminate = true;
    checkbox.indeterminate = false;
    checkbox.checked = false;
    expect(events).toEqual([]);
  });

  test("[disabled-blocks-toggle] ignores pointer and keyboard while disabled, including from a fieldset", async () => {
    const fieldset = render(`
      <fieldset>
        <${tagName} label="Updates" disabled></${tagName}>
      </fieldset>
    `);
    const checkbox = fieldset.querySelector(tagName);
    const input = controlOf(checkbox);
    const events = recordEvents(checkbox);

    expect(input.disabled).toBe(true);
    await userEvent.click(checkbox.shadowRoot.querySelector("label"), { force: true });
    checkbox.focus();
    await userEvent.keyboard(" ");
    expect(checkbox.checked).toBe(false);
    expect(events).toEqual([]);

    checkbox.disabled = false;
    expect(input.disabled).toBe(false);
    fieldset.disabled = true;
    expect(input.disabled).toBe(true);
    expect(checkbox.shadowRoot.querySelector(".field").classList.contains("is-disabled")).toBe(
      true,
    );
    fieldset.disabled = false;
    expect(input.disabled).toBe(false);
  });

  test("[a11y-state-not-color-alone] draws a check when checked and a dash when indeterminate", () => {
    const checkbox = render(`<${tagName} label="Updates"></${tagName}>`);

    expect(shown(checkbox, ".check")).toBe(false);
    expect(shown(checkbox, ".dash")).toBe(false);

    checkbox.checked = true;
    expect(shown(checkbox, ".check")).toBe(true);
    expect(shown(checkbox, ".dash")).toBe(false);

    checkbox.indeterminate = true;
    expect(shown(checkbox, ".check")).toBe(false);
    expect(shown(checkbox, ".dash")).toBe(true);

    checkbox.disabled = true;
    expect(shown(checkbox, ".dash")).toBe(true);
  });

  test("[a11y-forced-colors] keeps the box, indicator, and focus visible under forced colors", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    const checkbox = render(`<${tagName} label="Updates"></${tagName}>`);
    const input = controlOf(checkbox);
    const indicator = checkbox.shadowRoot.querySelector(".indicator");
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const canvas = document.createElement("div");
    canvas.style.backgroundColor = "Canvas";
    document.body.append(canvas);
    const page = getComputedStyle(canvas).backgroundColor;

    for (const setup of [
      () => {},
      () => (checkbox.checked = true),
      () => (checkbox.indeterminate = true),
      () => (checkbox.disabled = true),
    ]) {
      setup();
      const box = getComputedStyle(input);
      expect(box.borderTopStyle).toBe("solid");
      expect(box.borderTopColor).not.toBe(page);
      if (checkbox.checked || checkbox.indeterminate) {
        expect(getComputedStyle(indicator).color).not.toBe(box.backgroundColor);
      }
    }

    checkbox.disabled = false;
    await userEvent.tab();
    expect(input.matches(":focus-visible")).toBe(true);
    expect(getComputedStyle(input).outlineStyle).not.toBe("none");
  });

  test("[form-value][error-blocks-submit] submits its value only when checked and blocks submit while required, unchecked, or in error", () => {
    const form = render(`
      <form>
        <${tagName} label="I agree" name="terms" required></${tagName}>
        <${buttonTag} type="submit">Continue</${buttonTag}>
      </form>
    `);
    const checkbox = form.querySelector(tagName);
    const submit = vi.fn((event) => event.preventDefault());
    form.addEventListener("submit", submit);

    expect(checkbox.value).toBe("on");
    form.querySelector(buttonTag).click();
    expect(submit).not.toHaveBeenCalled();

    checkbox.checked = true;
    form.querySelector(buttonTag).click();
    expect(submit).toHaveBeenCalledOnce();
    expect(new FormData(form).get("terms")).toBe("on");

    submit.mockClear();
    checkbox.error = "Agree to the terms to continue.";
    form.querySelector(buttonTag).click();
    expect(submit).not.toHaveBeenCalled();
  });

  test("resets to the checked attribute and clears indeterminate", async () => {
    const form = render(`
      <form>
        <${tagName} label="Updates" name="updates" checked></${tagName}>
      </form>
    `);
    const checkbox = form.querySelector(tagName);

    await userEvent.click(controlOf(checkbox));
    expect(checkbox.checked).toBe(false);
    checkbox.indeterminate = true;

    form.reset();
    expect(checkbox.checked).toBe(true);
    expect(checkbox.indeterminate).toBe(false);
    expect(new FormData(form).get("updates")).toBe("on");
  });

  test("the checked attribute stops driving state once the user toggles", async () => {
    const checkbox = render(`<${tagName} label="Updates"></${tagName}>`);

    checkbox.setAttribute("checked", "");
    expect(checkbox.checked).toBe(true);

    await userEvent.click(controlOf(checkbox));
    expect(checkbox.checked).toBe(false);
    checkbox.removeAttribute("checked");
    checkbox.setAttribute("checked", "");
    expect(checkbox.checked).toBe(false);
  });
});
