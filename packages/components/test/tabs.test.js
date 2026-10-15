import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { cdp, userEvent } from "vitest/browser";

import { defineTabs } from "../src/tabs.js";
import { exposedNodes } from "./helpers/accessibility.js";
import { resolvedValue } from "./helpers/tokens.js";

const tag = "test-ds-tabs";

beforeAll(() => defineTabs(tag));

afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

function render(attributes = 'label="Account"') {
  document.body.innerHTML = `<${tag} ${attributes}>
    <ds-tab-panel label="Profile" value="profile"><p>Profile content</p></ds-tab-panel>
    <ds-tab-panel label="Notifications" value="notifications"><p>Notification content</p></ds-tab-panel>
    <ds-tab-panel label="Billing" value="billing"><p>Billing content</p></ds-tab-panel>
  </${tag}><button>After</button>`;
  return document.querySelector(tag);
}

function tabs(host) {
  return [...host.shadowRoot.querySelectorAll('[part="tab"]')];
}

function panels(host) {
  return [...host.querySelectorAll("ds-tab-panel")];
}

/** The panels a person can see. */
function shown(host) {
  return panels(host)
    .filter((panel) => panel.getClientRects().length > 0)
    .map((panel) => panel.value);
}

function changes(host) {
  const received = [];
  host.addEventListener("change", () => received.push(host.value));
  return received;
}

describe("DsTabs", () => {
  test("[one-selected] selects and shows only the first panel by default", () => {
    const host = render();
    expect(host.value).toBe("profile");
    expect(tabs(host).map((tab) => tab.getAttribute("aria-selected"))).toEqual([
      "true",
      "false",
      "false",
    ]);
    expect(shown(host)).toEqual(["profile"]);
  });

  test("[one-selected] shows the panel named by value, and falls back to the first", () => {
    const host = render('label="Account" value="billing"');
    expect(shown(host)).toEqual(["billing"]);
    host.value = "missing";
    expect(host.value).toBe("profile");
    expect(shown(host)).toEqual(["profile"]);
  });

  test("[one-selected] hides unselected panels from assistive technology", async () => {
    render();
    const names = (await exposedNodes()).map((node) => node.name);
    expect(names).toContain("Profile content");
    expect(names).not.toContain("Notification content");
    expect(names).not.toContain("Billing content");
  });

  test("[selection-reports-change] clicking another tab selects it and reports change", async () => {
    const host = render();
    const received = changes(host);
    await userEvent.click(tabs(host)[2]);
    expect(host.value).toBe("billing");
    expect(shown(host)).toEqual(["billing"]);
    expect(received).toEqual(["billing"]);
  });

  test("[selection-reports-change] reselecting or setting value reports nothing", async () => {
    const host = render();
    const received = changes(host);
    await userEvent.click(tabs(host)[0]);
    host.value = "notifications";
    expect(shown(host)).toEqual(["notifications"]);
    expect(received).toEqual([]);
  });

  test("[keyboard-tabs] Tab enters at the selected tab and arrows select with wrapping", async () => {
    const host = render('label="Account" value="notifications"');
    const received = changes(host);
    await userEvent.tab();
    expect(host.shadowRoot.activeElement).toBe(tabs(host)[1]);
    await userEvent.keyboard("{ArrowRight}");
    expect(host.shadowRoot.activeElement).toBe(tabs(host)[2]);
    await userEvent.keyboard("{ArrowRight}");
    expect(host.shadowRoot.activeElement).toBe(tabs(host)[0]);
    await userEvent.keyboard("{ArrowLeft}");
    expect(host.shadowRoot.activeElement).toBe(tabs(host)[2]);
    expect(received).toEqual(["billing", "profile", "billing"]);
    expect(shown(host)).toEqual(["billing"]);
  });

  test("[keyboard-tabs] Home and End select the first and last tab", async () => {
    const host = render('label="Account" value="notifications"');
    host.focus();
    await userEvent.keyboard("{End}");
    expect(host.value).toBe("billing");
    expect(host.shadowRoot.activeElement).toBe(tabs(host)[2]);
    await userEvent.keyboard("{Home}");
    expect(host.value).toBe("profile");
    expect(host.shadowRoot.activeElement).toBe(tabs(host)[0]);
  });

  test("[keyboard-tabs] arrows follow the reading direction in right-to-left layouts", async () => {
    const host = render('label="Account" dir="rtl"');
    host.focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(host.value).toBe("notifications");
    await userEvent.keyboard("{ArrowRight}");
    expect(host.value).toBe("profile");
    const [first, second] = tabs(host);
    expect(second.getBoundingClientRect().right).toBeLessThan(first.getBoundingClientRect().left);
  });

  test("[keyboard-tabs][panel-reachable] Tab leaves the tab list for the panel", async () => {
    const host = render();
    await userEvent.tab();
    await userEvent.tab();
    const panel = host.shadowRoot.querySelector('[part="panel"]');
    expect(host.shadowRoot.activeElement).toBe(panel);
    expect(panel.matches(":focus-visible")).toBe(true);
    expect(getComputedStyle(panel).outlineStyle).not.toBe("none");
    await userEvent.tab();
    expect(document.activeElement).toBe(document.querySelector("button"));
  });

  test("[accessible-tabs] names the tab list, each tab, and the panel", async () => {
    const host = render();
    const nodes = await exposedNodes();
    expect(nodes).toContainEqual({ role: "tablist", name: "Account" });
    for (const name of ["Profile", "Notifications", "Billing"]) {
      expect(nodes).toContainEqual({ role: "tab", name });
    }
    expect(nodes).toContainEqual({ role: "tabpanel", name: "Profile" });
    host.value = "billing";
    expect(await exposedNodes()).toContainEqual({ role: "tabpanel", name: "Billing" });
  });

  test("[visible-selection] marks the selected tab with an indicator", () => {
    const host = render();
    const indicators = tabs(host).map((tab) => tab.querySelector('[part="selected-indicator"]'));
    expect(indicators.map((indicator) => getComputedStyle(indicator).display !== "none")).toEqual([
      true,
      false,
      false,
    ]);
    expect(getComputedStyle(indicators[0]).backgroundColor).toBe(
      resolvedValue("background-color", "var(--semantic-color-background-action-primary-default)"),
    );
  });

  test("[visible-selection] keeps the indicator and focus visible under forced colors", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    const host = render();
    await userEvent.tab();
    const [tab] = tabs(host);
    const indicator = tab.querySelector('[part="selected-indicator"]');
    expect(tab.matches(":focus-visible")).toBe(true);
    expect(getComputedStyle(tab).outlineStyle).toBe("solid");
    expect(getComputedStyle(indicator).display).not.toBe("none");
    expect(getComputedStyle(indicator).backgroundColor).not.toBe(
      getComputedStyle(tab).backgroundColor,
    );
  });

  test("updates tabs when panels are added, removed, or relabeled", async () => {
    const host = render();
    const [profile] = panels(host);
    profile.label = "Your profile";
    await expect.poll(() => tabs(host)[0].textContent).toBe("Your profile");
    const added = document.createElement("ds-tab-panel");
    added.label = "Security";
    added.value = "security";
    host.append(added);
    await expect.poll(() => tabs(host).length).toBe(4);
    host.value = "security";
    expect(shown(host)).toEqual(["security"]);
    added.remove();
    await expect.poll(() => tabs(host).length).toBe(3);
    expect(host.value).toBe("profile");
    expect(shown(host)).toEqual(["profile"]);
  });

  test("a panel's value defaults to its label", () => {
    document.body.innerHTML = `<${tag} label="Order"><ds-tab-panel label="Details">A</ds-tab-panel><ds-tab-panel label="History">B</ds-tab-panel></${tag}>`;
    const host = document.querySelector(tag);
    expect(host.value).toBe("Details");
    host.value = "History";
    expect(shown(host)).toEqual(["History"]);
  });

  test("keeps focus on the tab list when the selected tab is relabeled", async () => {
    const host = render();
    host.focus();
    panels(host)[0].label = "Me";
    await expect.poll(() => tabs(host)[0].textContent).toBe("Me");
    expect(host.shadowRoot.activeElement).toBe(tabs(host)[0]);
  });
});
