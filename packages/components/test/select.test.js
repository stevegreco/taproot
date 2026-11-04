import { afterEach, beforeAll, expect, test, vi } from "vitest";
import { defineSelect } from "../src/select.js";
const tag = "test-select";
beforeAll(() => defineSelect(tag));
afterEach(() => document.body.replaceChildren());
function render(
  attributes = "",
  options = '<option value="">Choose</option><optgroup label="Delivery"><option value="standard">Standard</option><option value="express">Express</option><option value="overnight" disabled>Overnight</option></optgroup>',
) {
  document.body.innerHTML = `<form><${tag} label="Delivery" name="delivery" ${attributes}>${options}</${tag}></form>`;
  const field = document.querySelector(tag);
  return {
    form: document.querySelector("form"),
    field,
    control: field.shadowRoot.querySelector("select"),
  };
}
test("mirrors option groups and disabled choices; submits and resets selected values", () => {
  const { form, field, control } = render('value="standard"');
  expect(control.options.length).toBe(4);
  expect(control.querySelector("optgroup").label).toBe("Delivery");
  expect(control.options[3].disabled).toBe(true);
  field.value = "express";
  expect(new FormData(form).get("delivery")).toBe("express");
  field.setAttribute("value", "standard");
  expect(field.value).toBe("express");
  form.reset();
  expect(field.value).toBe("standard");
});
test("native selected option determines default when no value attribute exists", () => {
  const { form, field } = render(
    "",
    '<option value="one">One</option><option value="two" selected>Two</option>',
  );
  expect(field.value).toBe("two");
  field.value = "one";
  form.reset();
  expect(field.value).toBe("two");
});
test("required empty selection and custom errors block submission", () => {
  const { form, field, control } = render('required hint="Choose shipping"');
  expect(form.checkValidity()).toBe(false);
  field.value = "express";
  expect(form.checkValidity()).toBe(true);
  field.error = "Choose a supported method.";
  expect(form.checkValidity()).toBe(false);
  expect(control.getAttribute("aria-describedby")).toBe("hint error");
  expect(control.getAttribute("aria-invalid")).toBe("true");
  field.error = "";
  expect(form.checkValidity()).toBe(true);
  expect(control.hasAttribute("aria-invalid")).toBe(false);
});
test("reset restores the empty first choice when no value was set", () => {
  const { form, field, control } = render();
  field.value = "express";
  form.reset();
  expect(field.value).toBe("");
  expect(control.value).toBe("");
});
test("choice content mutations preserve current selection and refresh content", async () => {
  const { field, control } = render();
  field.value = "express";
  field.querySelector('option[value="express"]').textContent = "Express delivery";
  await vi.waitFor(() => expect(control.options[2].textContent).toBe("Express delivery"));
  expect(field.value).toBe("express");
  field.querySelector('option[value="express"]').remove();
  await vi.waitFor(() => expect(control.options.length).toBe(3));
  expect(field.value).toBe("");
});
test("change redispatches once and programmatic assignment emits no events", () => {
  const { field, control } = render();
  const changed = vi.fn();
  field.addEventListener("change", changed);
  field.value = "express";
  expect(changed).not.toHaveBeenCalled();
  control.value = "standard";
  control.dispatchEvent(new Event("change", { bubbles: true }));
  expect(changed).toHaveBeenCalledOnce();
  expect(field.value).toBe("standard");
});
test("fieldset disabling excludes values and restored selection survives reconnect", () => {
  const { form, field, control } = render('value="standard"');
  const fieldset = document.createElement("fieldset");
  form.append(fieldset);
  fieldset.append(field);
  fieldset.disabled = true;
  expect(control.disabled).toBe(true);
  expect(new FormData(form).has("delivery")).toBe(false);
  fieldset.disabled = false;
  field.formStateRestoreCallback("express", "restore");
  field.remove();
  fieldset.append(field);
  expect(field.value).toBe("express");
  expect(new FormData(form).get("delivery")).toBe("express");
  form.reset();
  expect(field.value).toBe("standard");
});
test("disabled selected options and disabled groups omit their value", () => {
  const { form, field } = render();
  field.value = "overnight";
  expect(new FormData(form).has("delivery")).toBe(false);
  field.value = "express";
  field.querySelector("optgroup").disabled = true;
  return vi.waitFor(() => expect(new FormData(form).has("delivery")).toBe(false));
});
test("removing then reinserting the old choice does not revive stale selection", async () => {
  const { field } = render();
  field.value = "express";
  const option = field.querySelector('option[value="express"]');
  option.remove();
  await vi.waitFor(() => expect(field.value).toBe(""));
  field.append(option);
  await vi.waitFor(() => expect(field.shadowRoot.querySelector("select").options.length).toBe(4));
  expect(field.value).toBe("");
});
