import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { cdp, userEvent } from "vitest/browser";

import { defineAlert } from "../src/alert.js";
import { defineButton } from "../src/button.js";
import { exposedNodes } from "./helpers/accessibility.js";
import { expectRendered } from "./helpers/rendered.js";
import { resolvedValue } from "./helpers/tokens.js";

const tagName = "test-ds-alert";
const buttonTag = "test-ds-alert-button";
const variants = ["info", "success", "warning", "danger"];
const liveRoles = ["alert", "status"];

beforeAll(() => {
  defineAlert(tagName);
  defineButton(buttonTag);
});

afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

function render(markup) {
  document.body.innerHTML = markup;
  return document.body.querySelector(tagName);
}

function dismissOf(alert) {
  return alert.shadowRoot.querySelector('[part="dismiss"]');
}

function liveRegionOf(alert) {
  return alert.shadowRoot.querySelector('[role="alert"], [role="status"]');
}

async function liveNodes() {
  return (await exposedNodes()).filter((node) => liveRoles.includes(node.role));
}

describe("DsAlert", () => {
  test("[text-states-status] exposes the title and message as text", async () => {
    render(
      `<${tagName} variant="danger" label="Upload failed">The file is larger than 10 MB.</${tagName}>`,
    );

    const names = (await exposedNodes()).map((node) => node.name);

    expect(names).toContain("Upload failed");
    expect(names).toContain("The file is larger than 10 MB.");
  });

  test("[announce-on-request] is not a live region when announce is off", async () => {
    const alert = render(`<${tagName} label="Update">A new version is available.</${tagName}>`);

    expectRendered(alert, "message");
    expect(await liveNodes()).toEqual([]);
  });

  test.each([
    ["polite", "status"],
    ["urgent", "alert"],
  ])("[announce-on-request] announce %s exposes a %s", async (announce, role) => {
    render(`<${tagName} announce="${announce}">Your changes were saved.</${tagName}>`);

    const nodes = await liveNodes();

    expect(nodes.map((node) => node.role)).toEqual([role]);
  });

  test("[announce-on-request] follows announce when it changes", async () => {
    const alert = render(`<${tagName}>Your session expires soon.</${tagName}>`);

    alert.announce = "urgent";
    expect((await liveNodes()).map((node) => node.role)).toEqual(["alert"]);
    alert.announce = "off";
    expect(await liveNodes()).toEqual([]);
  });

  test("[announce-on-request] announces the title and message, not the actions or dismiss control", () => {
    const alert = render(
      `<${tagName} announce="polite" label="Saved" dismissible>
        Your changes were saved.
        <${buttonTag} slot="actions" variant="tertiary">Undo</${buttonTag}>
      </${tagName}>`,
    );
    const region = liveRegionOf(alert);

    expect(region.contains(alert.shadowRoot.querySelector('[part="title"]'))).toBe(true);
    expect(region.contains(alert.shadowRoot.querySelector('[part="message"]'))).toBe(true);
    expect(region.contains(alert.shadowRoot.querySelector('[part="actions"]'))).toBe(false);
    expect(region.contains(dismissOf(alert))).toBe(false);
  });

  test.each(variants)(
    "[announce-independent-of-variant] the %s variant does not change announcement",
    async (variant) => {
      const alert = render(`<${tagName} variant="${variant}">Message</${tagName}>`);

      expect(await liveNodes()).toEqual([]);
      alert.announce = "polite";
      expect((await liveNodes()).map((node) => node.role)).toEqual(["status"]);
    },
  );

  test("[no-focus-on-appear] appearing as urgent leaves focus where it was", () => {
    document.body.innerHTML = `<button>Save</button>`;
    const save = document.querySelector("button");
    save.focus();

    const alert = document.createElement(tagName);
    alert.announce = "urgent";
    alert.dismissible = true;
    alert.textContent = "Your session expires in 1 minute.";
    document.body.append(alert);
    alert.hidden = true;
    alert.hidden = false;

    expect(dismissOf(alert).getClientRects().length).toBeGreaterThan(0);
    expect(document.activeElement).toBe(save);
  });

  test("[dismiss-reports] shows no dismiss control unless dismissible", async () => {
    const alert = render(`<${tagName}>Message</${tagName}>`);

    expectRendered(alert, "message", "dismiss");
    expect(dismissOf(alert).getClientRects().length).toBe(0);
    expect((await exposedNodes()).filter((node) => node.role === "button")).toEqual([]);
    alert.dismissible = true;
    expect(dismissOf(alert).getClientRects().length).toBeGreaterThan(0);
  });

  test("[dismiss-reports] reports dismiss once and hides", async () => {
    const alert = render(`<${tagName} dismissible>Message</${tagName}>`);
    const received = [];
    alert.addEventListener("dismiss", (event) => received.push(event));

    await userEvent.click(dismissOf(alert));

    expect(received).toHaveLength(1);
    expect(received[0].target).toBe(alert);
    expect(received[0].cancelable).toBe(true);
    expect(alert.hidden).toBe(true);
    expect(getComputedStyle(alert).display).toBe("none");
  });

  test("[dismiss-reports] stays shown when dismiss is prevented", async () => {
    const alert = render(`<${tagName} dismissible>Message</${tagName}>`);
    alert.addEventListener("dismiss", (event) => event.preventDefault());

    await userEvent.click(dismissOf(alert));

    expect(alert.hidden).toBe(false);
  });

  test.each(["Enter", "Space"])(
    "[dismiss-reports] %s on the dismiss control dismisses",
    async (key) => {
      const alert = render(`<${tagName} dismissible>Message</${tagName}>`);

      dismissOf(alert).focus();
      await userEvent.keyboard(key === "Space" ? " " : `{${key}}`);

      expect(alert.hidden).toBe(true);
    },
  );

  test("[dismiss-reports] Escape does not dismiss", async () => {
    const alert = render(`<${tagName} dismissible>Message</${tagName}>`);
    const received = [];
    alert.addEventListener("dismiss", (event) => received.push(event));

    dismissOf(alert).focus();
    await userEvent.keyboard("{Escape}");

    expect(received).toEqual([]);
    expect(alert.hidden).toBe(false);
  });

  test("[focus-after-dismiss] moves focus to the next focusable item", async () => {
    render(
      `<button>Before</button><${tagName} dismissible>Message</${tagName}><button>After</button>`,
    );
    const alert = document.querySelector(tagName);

    dismissOf(alert).focus();
    await userEvent.keyboard("{Enter}");

    expect(document.activeElement.textContent).toBe("After");
  });

  test("[focus-after-dismiss] reaches a focusable item inside another component", async () => {
    render(`<${tagName} dismissible>Message</${tagName}><${buttonTag}>Continue</${buttonTag}>`);
    const alert = document.querySelector(tagName);
    const next = document.querySelector(buttonTag);

    dismissOf(alert).focus();
    await userEvent.keyboard("{Enter}");

    expect(document.activeElement).toBe(next);
    expect(next.shadowRoot.activeElement).toBe(next.shadowRoot.querySelector("button"));
  });

  test("[focus-after-dismiss] moves focus to the previous item when nothing follows", async () => {
    render(`<button>Before</button><${tagName} dismissible>Message</${tagName}>`);
    const alert = document.querySelector(tagName);

    dismissOf(alert).focus();
    await userEvent.keyboard("{Enter}");

    expect(document.activeElement.textContent).toBe("Before");
  });

  test("[focus-after-dismiss] moves focus from a slotted action", async () => {
    render(
      `<${tagName} dismissible>Message<button slot="actions">Retry</button></${tagName}><button>After</button>`,
    );
    const alert = document.querySelector(tagName);
    await new Promise(requestAnimationFrame);
    alert.querySelector("button").focus();
    expect(document.activeElement.textContent).toBe("Retry");

    alert.hidden = true;
    await new Promise(requestAnimationFrame);

    expect(document.activeElement.textContent).toBe("After");
  });

  test("[focus-after-dismiss] leaves focus where a dismiss handler moved it", async () => {
    render(
      `<button>Before</button><${tagName} dismissible>Message</${tagName}><button>After</button>`,
    );
    const alert = document.querySelector(tagName);
    const before = document.querySelector("button");
    alert.addEventListener("dismiss", () => before.focus());

    dismissOf(alert).focus();
    await userEvent.keyboard("{Enter}");

    expect(document.activeElement).toBe(before);
  });

  test("[dismiss-accessible-name] names the dismiss control Dismiss by default", async () => {
    render(`<${tagName} dismissible>Message</${tagName}>`);

    expect(await exposedNodes()).toContainEqual({ role: "button", name: "Dismiss" });
  });

  test("[dismiss-accessible-name] takes its name from dismiss-label", async () => {
    const alert = render(
      `<${tagName} dismissible dismiss-label="Close message">Message</${tagName}>`,
    );

    expect(await exposedNodes()).toContainEqual({ role: "button", name: "Close message" });
    alert.dismissLabel = "Ignorer";
    expect(await exposedNodes()).toContainEqual({ role: "button", name: "Ignorer" });
  });

  test.each(variants)(
    "[visible-focus] shows the focus border on the dismiss control on %s",
    async (variant) => {
      const alert = render(`<${tagName} variant="${variant}" dismissible>Message</${tagName}>`);
      const dismiss = dismissOf(alert);

      await userEvent.tab();

      expect(alert.shadowRoot.activeElement).toBe(dismiss);
      expect(dismiss.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(dismiss);
      expect(style.outlineStyle).toBe("solid");
      expect(parseFloat(style.outlineWidth)).toBeGreaterThan(0);
      expect(style.outlineColor).toBe(
        resolvedValue("color", "var(--ds-semantic-color-border-focus)"),
      );
    },
  );

  test.each([
    ["info", "info"],
    ["success", "success"],
    ["warning", "warning"],
    ["danger", "danger"],
    [null, "info"],
  ])("variant %s paints the %s status surface", (variant, status) => {
    const alert = render(
      `<${tagName}${variant ? ` variant="${variant}"` : ""}>Message</${tagName}>`,
    );
    const surface = getComputedStyle(alert.shadowRoot.querySelector('[part="surface"]'));
    const icon = getComputedStyle(alert.shadowRoot.querySelector('[part="icon"]'));

    expect(surface.backgroundColor).toBe(
      resolvedValue(
        "background-color",
        `var(--ds-semantic-color-background-status-${status}-default)`,
      ),
    );
    expect(surface.borderTopColor).toBe(
      resolvedValue("color", `var(--ds-semantic-color-border-status-${status}-default)`),
    );
    expect(surface.color).toBe(
      resolvedValue("color", "var(--ds-semantic-color-foreground-default)"),
    );
    expect(icon.color).toBe(
      resolvedValue("color", `var(--ds-semantic-color-foreground-status-${status}-default)`),
    );
  });

  test("collapses the title, icon, and actions when they are empty", () => {
    const alert = render(`<${tagName}>Message</${tagName}>`);
    const rendered = (part) =>
      alert.shadowRoot.querySelector(`[part="${part}"]`).getClientRects().length > 0;

    expect(["title", "icon", "actions"].filter(rendered)).toEqual([]);

    alert.label = "Saved";
    alert.insertAdjacentHTML(
      "beforeend",
      `<span slot="icon">*</span><a slot="actions" href="#">Undo</a>`,
    );
    return new Promise(requestAnimationFrame).then(() => {
      expect(["title", "icon", "actions"].filter(rendered)).toEqual(["title", "icon", "actions"]);
    });
  });

  test("[forced-colors] keeps the boundary and dismiss focus visible under forced colors", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    const alert = render(`<${tagName} variant="danger" dismissible>Message</${tagName}>`);
    const surface = getComputedStyle(alert.shadowRoot.querySelector('[part="surface"]'));
    const canvas = resolvedValue("color", "Canvas");

    expect(surface.borderTopStyle).toBe("solid");
    expect(parseFloat(surface.borderTopWidth)).toBeGreaterThan(0);
    expect(surface.borderTopColor).toBe(resolvedValue("color", "CanvasText"));
    expect(surface.borderTopColor).not.toBe(canvas);

    await userEvent.tab();
    const dismiss = getComputedStyle(dismissOf(alert));
    expect(dismiss.outlineStyle).toBe("solid");
    expect(dismiss.outlineColor).toBe(resolvedValue("color", "Highlight"));
  });
});
