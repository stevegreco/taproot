import { afterEach, beforeAll, expect, test, vi } from "vitest";
import { defineTextArea } from "../src/text-area.js";
const tag = "test-text-area";
beforeAll(() => defineTextArea(tag));
afterEach(() => document.body.replaceChildren());
function render(attributes = "") {
  document.body.innerHTML = `<form><${tag} label="Notes" name="notes" ${attributes}></${tag}></form>`;
  const field = document.querySelector(tag);
  return {
    form: document.querySelector("form"),
    field,
    control: field.shadowRoot.querySelector("textarea"),
  };
}
test("multiline value submits, remains dirty after initial value changes, and resets", () => {
  const { form, field, control } = render('value="Original"');
  const events = vi.fn();
  field.addEventListener("input", events);
  field.value = "First line\nSecond line";
  expect(control.value).toBe("First line\nSecond line");
  expect(new FormData(form).get("notes")).toBe("First line\nSecond line");
  expect(events).not.toHaveBeenCalled();
  field.setAttribute("value", "Reset value");
  expect(field.value).toBe("First line\nSecond line");
  form.reset();
  expect(field.value).toBe("Reset value");
});
test("readonly keeps focusability and submission; rows normalizes invalid values", () => {
  const { form, field, control } = render('readonly value="Read me" rows="6"');
  expect(control.readOnly).toBe(true);
  expect(control.disabled).toBe(false);
  expect(new FormData(form).get("notes")).toBe("Read me");
  expect(control.rows).toBe(6);
  for (const value of ["0", "-1", "1.5", "garbage"]) {
    field.setAttribute("rows", value);
    expect(field.rows).toBe(4);
    expect(control.rows).toBe(4);
  }
});
test("required and custom errors block submission, hint/error descriptions stay associated", () => {
  const { form, field, control } = render('required hint="Explain why"');
  expect(form.checkValidity()).toBe(false);
  field.value = "A reason";
  expect(form.checkValidity()).toBe(true);
  field.error = "Add more detail.";
  expect(form.checkValidity()).toBe(false);
  expect(control.getAttribute("aria-describedby")).toBe("hint error");
  expect(control.getAttribute("aria-invalid")).toBe("true");
  field.error = "";
  expect(form.checkValidity()).toBe(true);
  expect(control.getAttribute("aria-describedby")).toBe("hint");
  expect(control.hasAttribute("aria-invalid")).toBe(false);
});
test("fieldset disabled state excludes and restores current value, restore respects reset default", () => {
  const { form, field, control } = render('value="Default"');
  const fieldset = document.createElement("fieldset");
  form.append(fieldset);
  fieldset.append(field);
  fieldset.disabled = true;
  expect(control.disabled).toBe(true);
  expect(new FormData(form).has("notes")).toBe(false);
  fieldset.disabled = false;
  expect(new FormData(form).get("notes")).toBe("Default");
  field.formStateRestoreCallback("Recovered\nnotes", "restore");
  expect(field.value).toBe("Recovered\nnotes");
  form.reset();
  expect(field.value).toBe("Default");
});
