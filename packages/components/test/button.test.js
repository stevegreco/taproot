import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import { styles } from "../dist/button.styles.js";
import { DsButton, defineButton } from "../src/button.js";

const tagName = "test-ds-button";

beforeAll(() => {
  defineButton(tagName);
});

afterEach(() => {
  document.body.replaceChildren();
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.firstElementChild;
}

describe("DsButton", () => {
  test("can be registered under more than one tag name", () => {
    const alias = "test-ds-button-alias";

    expect(() => defineButton(alias)).not.toThrow();
    expect(customElements.get(alias)).toBeDefined();
    expect(document.createElement(alias)).toBeInstanceOf(DsButton);
    expect(() => defineButton(alias)).not.toThrow();
  });

  test("follows disabled fieldset state", () => {
    const fieldset = render(`<fieldset><${tagName}>Save</${tagName}></fieldset>`);
    const button = fieldset.querySelector(tagName);
    const control = button.shadowRoot.querySelector("button");

    expect(control.disabled).toBe(false);
    fieldset.disabled = true;
    expect(control.disabled).toBe(true);
    fieldset.disabled = false;
    expect(control.disabled).toBe(false);
  });

  test("keeps an explicitly disabled button disabled after its fieldset is enabled", () => {
    const fieldset = render(
      `<fieldset disabled><${tagName} disabled>Save</${tagName}></fieldset>`,
    );
    const control = fieldset.querySelector(tagName).shadowRoot.querySelector("button");

    fieldset.disabled = false;
    expect(control.disabled).toBe(true);
  });

  test("blocks programmatic activation while its fieldset is disabled", () => {
    const form = render(`
      <form>
        <fieldset disabled>
          <${tagName} type="submit">Save</${tagName}>
        </fieldset>
      </form>
    `);
    const button = form.querySelector(tagName);
    const click = vi.fn();
    const submit = vi.fn((event) => event.preventDefault());
    button.addEventListener("click", click);
    form.addEventListener("submit", submit);

    button.click();
    expect(click).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });

  test("submits its associated form after native constraint validation", () => {
    const form = render(`
      <form>
        <input name="email" type="email" required>
        <${tagName} type="submit">Submit</${tagName}>
      </form>
    `);
    const submit = vi.fn((event) => event.preventDefault());
    const button = form.querySelector(tagName);
    form.addEventListener("submit", submit);

    button.click();
    expect(submit).not.toHaveBeenCalled();

    form.elements.email.value = "person@example.com";
    button.click();
    expect(submit).toHaveBeenCalledOnce();
  });

  test("resets its associated form", () => {
    const form = render(`
      <form>
        <input name="query" value="initial">
        <${tagName} type="reset">Reset</${tagName}>
      </form>
    `);
    form.elements.query.value = "changed";

    form.querySelector(tagName).click();
    expect(form.elements.query.value).toBe("initial");
  });

  test("mirrors its accessible label and forwards focus", () => {
    const button = render(
      `<${tagName} aria-label="Continue"><svg aria-hidden="true"></svg></${tagName}>`,
    );
    const control = button.shadowRoot.querySelector("button");

    expect(control.getAttribute("aria-label")).toBe("Continue");
    button.focus();
    expect(button.shadowRoot.activeElement).toBe(control);

    button.removeAttribute("aria-label");
    expect(control.hasAttribute("aria-label")).toBe(false);
  });

  test("uses the dedicated pressed-state tokens", () => {
    expect(styles).toContain(
      "--_background-press: var(--component-button-ghost-background-press)",
    );
    expect(styles).toContain(
      "--_background-press: var(--component-button-danger-background-press)",
    );
  });
});
