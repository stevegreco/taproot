import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import { defineButton } from "../src/button.js";
import { DsTextField, defineTextField } from "../src/text-field.js";

const tagName = "test-ds-text-field";
const buttonTag = "test-ds-text-field-button";

beforeAll(() => {
  defineTextField(tagName);
  defineButton(buttonTag);
});

afterEach(() => {
  document.body.replaceChildren();
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.firstElementChild;
}

function controlOf(field) {
  return field.shadowRoot.querySelector("input");
}

describe("DsTextField", () => {
  test("can be registered under more than one tag name", () => {
    const alias = "test-ds-text-field-alias";

    expect(() => defineTextField(alias)).not.toThrow();
    expect(customElements.get(alias)).toBeDefined();
    expect(document.createElement(alias)).toBeInstanceOf(DsTextField);
    expect(() => defineTextField(alias)).not.toThrow();
  });

  test("associates the label, hint, error, and required state", () => {
    const field = render(`
      <${tagName}
        label="Email"
        hint="Work email"
        error="Enter a valid email address."
        required
      ></${tagName}>
    `);
    const input = controlOf(field);
    const label = field.shadowRoot.querySelector("label");
    const mark = field.shadowRoot.querySelector(".required");

    expect(input.labels).toContain(label);
    expect(label.textContent).toContain("Email");
    expect(mark.hidden).toBe(false);
    expect(mark.getAttribute("aria-hidden")).toBe("true");
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-describedby")).toBe("hint error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(field.shadowRoot.querySelector("#error").textContent).toBe(
      "Enter a valid email address.",
    );
  });

  test("describes only the messages that have text", () => {
    const field = render(`<${tagName} label="Email" hint="Work email"></${tagName}>`);
    const input = controlOf(field);

    expect(input.getAttribute("aria-describedby")).toBe("hint");
    expect(input.hasAttribute("aria-invalid")).toBe(false);

    field.hint = "";
    expect(input.hasAttribute("aria-describedby")).toBe(false);

    field.error = "Enter an email address.";
    expect(input.getAttribute("aria-describedby")).toBe("error");
    expect(input.getAttribute("aria-invalid")).toBe("true");

    field.error = "";
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });

  test("follows disabled fieldset state and keeps an explicit disabled field disabled", () => {
    const fieldset = render(`
      <fieldset>
        <${tagName} label="Email"></${tagName}>
      </fieldset>
    `);
    const field = fieldset.querySelector(tagName);
    const input = controlOf(field);

    expect(input.disabled).toBe(false);
    expect(field.matches(":disabled")).toBe(false);
    fieldset.disabled = true;
    expect(input.disabled).toBe(true);
    expect(field.shadowRoot.querySelector(".field").classList.contains("is-disabled")).toBe(true);
    fieldset.disabled = false;
    expect(input.disabled).toBe(false);

    field.disabled = true;
    fieldset.disabled = true;
    fieldset.disabled = false;
    expect(input.disabled).toBe(true);
  });

  test("forwards focus and falls back to text for an unknown type", () => {
    const field = render(
      `<${tagName} label="Query" type="search" placeholder="Search" autocomplete="off"></${tagName}>`,
    );
    const input = controlOf(field);

    field.focus();
    expect(field.shadowRoot.activeElement).toBe(input);
    expect(input.type).toBe("search");
    expect(input.placeholder).toBe("Search");
    expect(input.autocomplete).toBe("off");

    field.type = "file";
    expect(field.type).toBe("text");
    expect(input.type).toBe("text");
  });

  test("submits its value with a button and blocks submit while an error is set", () => {
    const form = render(`
      <form>
        <${tagName} label="Email" name="email" type="email"></${tagName}>
        <${buttonTag} type="submit">Continue</${buttonTag}>
      </form>
    `);
    const field = form.querySelector(tagName);
    const submit = vi.fn((event) => event.preventDefault());
    form.addEventListener("submit", submit);

    field.value = "person@example.com";
    form.querySelector(buttonTag).click();
    expect(submit).toHaveBeenCalledOnce();
    expect(new FormData(form).get("email")).toBe("person@example.com");

    submit.mockClear();
    field.error = "Enter a valid email address.";
    form.querySelector(buttonTag).click();
    expect(submit).not.toHaveBeenCalled();
  });

  test("resets to the initial value", () => {
    const form = render(`
      <form>
        <${tagName} label="Email" name="email" value="first@example.com"></${tagName}>
      </form>
    `);
    const field = form.querySelector(tagName);
    const input = controlOf(field);

    input.value = "changed@example.com";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(field.value).toBe("changed@example.com");

    form.reset();
    expect(field.value).toBe("first@example.com");
    expect(new FormData(form).get("email")).toBe("first@example.com");
  });

  test("honors the native hidden attribute", () => {
    const field = render(`<${tagName} label="Email" hidden></${tagName}>`);

    expect(getComputedStyle(field).display).toBe("none");
  });
});
