import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { userEvent, cdp } from "vitest/browser";
import { defineRadioGroup } from "../src/radio-group.js";
const tag = "test-radio-group";
beforeAll(() => defineRadioGroup(tag));
afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});
function render(extra = "") {
  document.body.innerHTML = `<form><${tag} label="Delivery" name="delivery" value="a" ${extra}><option value="a">Standard</option><option value="b">Express</option><option value="c" disabled>Pickup</option></${tag}></form>`;
  return document.querySelector(tag);
}
function inputs(group) {
  return [...group.shadowRoot.querySelectorAll("input")];
}
describe("DsRadioGroup", () => {
  test("native arrow navigation selects one option and skips disabled options", async () => {
    const group = render();
    const [a, b, c] = inputs(group);
    const events = [];
    group.addEventListener("input", () => events.push("input"));
    group.addEventListener("change", () => events.push("change"));
    group.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(b.checked).toBe(true);
    expect(a.checked).toBe(false);
    expect(group.value).toBe("b");
    expect(events).toEqual(["input", "change"]);
    await userEvent.keyboard("{ArrowDown}");
    expect(a.checked).toBe(true);
    expect(c.checked).toBe(false);
    expect(c.disabled).toBe(true);
  });
  test("submits enabled selection and rejects required empty, unmatched and disabled values", () => {
    const group = render("required");
    const form = group.form;
    expect(new FormData(form).get("delivery")).toBe("a");
    for (const value of ["", "missing", "c"]) {
      group.value = value;
      expect(form.checkValidity()).toBe(false);
      expect(new FormData(form).has("delivery")).toBe(false);
    }
    group.value = "b";
    expect(form.checkValidity()).toBe(true);
    group.error = "Choose a delivery method.";
    expect(form.checkValidity()).toBe(false);
    group.error = "";
    expect(form.checkValidity()).toBe(true);
    group.disabled = true;
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).has("delivery")).toBe(false);
  });
  test("reset restores initial value and restore updates live value without events", () => {
    const group = render();
    const events = [];
    group.addEventListener("change", () => events.push("change"));
    group.value = "b";
    group.setAttribute("value", "a");
    expect(group.value).toBe("b");
    group.form.reset();
    expect(group.value).toBe("a");
    group.formStateRestoreCallback("b", "restore");
    expect(group.value).toBe("b");
    expect(new FormData(group.form).get("delivery")).toBe("b");
    expect(events).toEqual([]);
  });
  test("updates dynamic option labels, values and disabled states", async () => {
    const group = render();
    const option = group.querySelector('option[value="b"]');
    option.textContent = "Overnight";
    option.disabled = true;
    await expect.poll(() => inputs(group)[1].disabled).toBe(true);
    expect(group.shadowRoot.querySelectorAll(".choice")[1].textContent).toBe("Overnight");
    const added = document.createElement("option");
    added.value = "d";
    added.textContent = "Courier";
    group.append(added);
    await expect.poll(() => inputs(group).length).toBe(4);
    group.value = "d";
    expect(new FormData(group.form).get("delivery")).toBe("d");
  });
  test("associates group messages and exposes required state", () => {
    const group = render('required hint="Choose one" error="Try again"');
    const container = group.shadowRoot.querySelector('[role="radiogroup"]');
    expect(container.getAttribute("aria-labelledby")).toBe("label");
    expect(container.getAttribute("aria-describedby")).toBe("hint error");
    expect(container.getAttribute("aria-required")).toBe("true");
    expect(container.getAttribute("aria-invalid")).toBe("true");
    expect(inputs(group)[0].labels[0].textContent).toBe("Standard");
  });
  test("fieldset disabling prevents selection and re-enabling restores form value", () => {
    const group = render();
    const fieldset = document.createElement("fieldset");
    group.before(fieldset);
    fieldset.append(group);
    fieldset.disabled = true;
    expect(inputs(group).every((input) => input.disabled)).toBe(true);
    expect(new FormData(group.form).has("delivery")).toBe(false);
    fieldset.disabled = false;
    expect(new FormData(group.form).get("delivery")).toBe("a");
  });
  test("message and direction updates retain focus and option updates restore it", async () => {
    const group = render();
    const input = inputs(group)[0];
    group.focus();
    group.error = "Try again";
    group.hint = "Choose one";
    group.dir = "rtl";
    await Promise.resolve();
    expect(group.shadowRoot.activeElement).toBe(input);
    group.querySelector('option[value="a"]').textContent = "Updated";
    await expect.poll(() => inputs(group)[0].labels[0].textContent).toBe("Updated");
    expect(group.shadowRoot.activeElement).toBe(inputs(group)[0]);
  });
  test("focus and blur safely handle disabled or empty groups", () => {
    const group = render("disabled");
    expect(() => group.focus()).not.toThrow();
    expect(() => group.blur()).not.toThrow();
    group.replaceChildren();
    expect(() => group.focus()).not.toThrow();
    expect(() => group.blur()).not.toThrow();
  });
  test("input listeners see current form value and cannot overwrite selection by changing its initial attribute", async () => {
    const group = render();
    const seen = [];
    group.addEventListener("input", () => {
      seen.push(new FormData(group.form).get("delivery"));
      group.setAttribute("value", "a");
    });
    await userEvent.click(inputs(group)[1]);
    expect(seen).toEqual(["b"]);
    expect(group.value).toBe("b");
  });
  test("disabled group label and hint use disabled foreground", () => {
    const group = render('disabled hint="Choose one"');
    const root = group.shadowRoot;
    expect(getComputedStyle(root.querySelector("#label")).color).toBe(
      getComputedStyle(root.querySelector("#hint")).color,
    );
    expect(getComputedStyle(root.querySelector("#label")).color).toBe(
      getComputedStyle(root.querySelector(".choice .label")).color,
    );
  });
  test("forced colors retain outline, selected dot and keyboard focus in RTL", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    const group = render();
    group.dir = "rtl";
    await userEvent.tab();
    const input = inputs(group)[0];
    const indicator = group.shadowRoot.querySelector(".indicator");
    expect(input.matches(":focus-visible")).toBe(true);
    expect(getComputedStyle(input).outlineStyle).toBe("solid");
    expect(getComputedStyle(indicator).display).toBe("block");
    expect(getComputedStyle(indicator).backgroundColor).not.toBe(
      getComputedStyle(input).backgroundColor,
    );
    const label = group.shadowRoot.querySelector(".choice .label");
    expect(label.getBoundingClientRect().right).toBeLessThan(input.getBoundingClientRect().left);
  });
});
