import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { cdp, userEvent } from "vitest/browser";

import { defineButton } from "../src/button.js";
import { resolvedValue } from "./helpers/tokens.js";

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
    const fieldset = render(`<fieldset disabled><${tagName} disabled>Save</${tagName}></fieldset>`);
    const control = fieldset.querySelector(tagName).shadowRoot.querySelector("button");

    fieldset.disabled = false;
    expect(control.disabled).toBe(true);
  });

  test("[disabled-prevents-activation] blocks programmatic activation while its fieldset is disabled", () => {
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

  test("[form-association] submits its associated form after native constraint validation", () => {
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

  test("[form-association] resets its associated form", () => {
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

  test("[icon-accessible-name] mirrors its accessible label and forwards focus", () => {
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
});

async function withForcedColors(check) {
  await cdp().send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  try {
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    await check();
  } finally {
    await cdp().send("Emulation.setEmulatedMedia", { features: [] });
  }
}

describe("DsButton under forced colors", () => {
  const color = (value) => resolvedValue("color", value);
  const styleOf = (button) => getComputedStyle(button.shadowRoot.querySelector("button"));

  test.each(["primary", "destructive"])(
    "[forced-colors] %s stays filled with Highlight",
    (variant) =>
      withForcedColors(() => {
        const style = styleOf(render(`<${tagName} variant="${variant}">Save changes</${tagName}>`));
        expect(style.backgroundColor).toBe(color("Highlight"));
        expect(style.borderTopColor).toBe(color("Highlight"));
        expect(style.color).toBe(color("HighlightText"));
      }),
  );

  test("[forced-colors] the default variant fills like primary", () =>
    withForcedColors(() => {
      expect(styleOf(render(`<${tagName}>Save changes</${tagName}>`)).backgroundColor).toBe(
        color("Highlight"),
      );
    }));

  test("[forced-colors] secondary is outlined", () =>
    withForcedColors(() => {
      const style = styleOf(render(`<${tagName} variant="secondary">Cancel</${tagName}>`));
      expect(style.backgroundColor).toBe(color("ButtonFace"));
      expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
      expect(style.borderTopColor).toBe(color("ButtonText"));
    }));

  test("[forced-colors] tertiary is text alone", () =>
    withForcedColors(() => {
      const style = styleOf(render(`<${tagName} variant="tertiary">View details</${tagName}>`));
      expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
      expect(style.borderTopColor).toBe("rgba(0, 0, 0, 0)");
      expect(style.color).toBe(color("ButtonText"));
    }));

  test.each(["primary", "secondary", "tertiary", "destructive"])(
    "[forced-colors] disabled %s reads as GrayText, not filled",
    (variant) =>
      withForcedColors(() => {
        const style = styleOf(
          render(`<${tagName} variant="${variant}" disabled>Save changes</${tagName}>`),
        );
        expect(style.color).toBe(color("GrayText"));
        expect(style.backgroundColor).not.toBe(color("Highlight"));
      }),
  );

  test("[forced-colors] hover and keyboard focus keep system colors", () =>
    withForcedColors(async () => {
      document.body.innerHTML = `<button>Before</button><${tagName}>Save changes</${tagName}>`;
      const button = document.querySelector(tagName);
      await userEvent.hover(button);
      expect(styleOf(button).backgroundColor).toBe(color("Highlight"));
      document.querySelector("button").focus();
      await userEvent.tab();
      expect(styleOf(button).outlineColor).toBe(color("Highlight"));
    }));
});
