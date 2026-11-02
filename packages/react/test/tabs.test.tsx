import { useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Tabs, TabsSection } from "../src/tabs/Tabs";

function Example(props: {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  accessibleName?: string;
  focusableInPanel?: boolean;
}) {
  const { focusableInPanel, accessibleName = "Account settings", ...rest } = props;
  return (
    <>
      <button type="button">Before</button>
      <Tabs accessibleName={accessibleName} {...rest}>
        <TabsSection value="profile" label="Profile">
          {focusableInPanel ? <button type="button">Edit profile</button> : <p>Profile content</p>}
        </TabsSection>
        <TabsSection value="notifications" label="Notifications">
          <p>Notifications content</p>
        </TabsSection>
        <TabsSection value="billing" label="Billing">
          <p>Billing content</p>
        </TabsSection>
      </Tabs>
      <button type="button">After</button>
    </>
  );
}

const tabs = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'));
const panels = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
const selectedTabs = () => tabs().filter((t) => t.getAttribute("aria-selected") === "true");
const selectedLabel = () => selectedTabs().map((t) => t.textContent);

/** Focus the button before the tabs, then press Tab into the tab list. */
async function tabIntoList() {
  page.getByRole("button", { name: "Before" }).element().focus();
  await userEvent.tab();
}

describe("component.tabs#one-selected (MUST)", () => {
  test("exactly one tab is selected and only its panel is rendered", async () => {
    await render(<Example defaultValue="notifications" />);
    expect(selectedLabel()).toEqual(["Notifications"]);
    expect(panels()).toHaveLength(1);
    expect(panels()[0].textContent).toBe("Notifications content");
    expect(document.body.textContent).not.toContain("Profile content");
  });

  test("no value selects the first section", async () => {
    await render(<Example />);
    expect(selectedLabel()).toEqual(["Profile"]);
  });

  test("an empty value selects the first section", async () => {
    await render(<Example value="" />);
    expect(selectedLabel()).toEqual(["Profile"]);
    expect(panels()).toHaveLength(1);
  });

  test("an unmatched controlled value selects the first section", async () => {
    await render(<Example value="missing" />);
    expect(selectedLabel()).toEqual(["Profile"]);
    expect(panels()[0].textContent).toBe("Profile content");
  });

  test("an unmatched default value selects the first section", async () => {
    await render(<Example defaultValue="missing" />);
    expect(selectedLabel()).toEqual(["Profile"]);
  });

  test("selection stays single after switching", async () => {
    await render(<Example />);
    await userEvent.click(page.getByRole("tab", { name: "Billing" }));
    expect(selectedLabel()).toEqual(["Billing"]);
    expect(panels()).toHaveLength(1);
    expect(panels()[0].textContent).toBe("Billing content");
  });
});

describe("component.tabs#selection-reports-change (MUST)", () => {
  test("pointer selection of a different tab reports change with its value", async () => {
    const onChange = vi.fn();
    await render(<Example onChange={onChange} />);
    await userEvent.click(page.getByRole("tab", { name: "Notifications" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("notifications");
  });

  test("keyboard selection reports change", async () => {
    const onChange = vi.fn();
    await render(<Example onChange={onChange} />);
    await tabIntoList();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("notifications");
  });

  test("choosing the already selected tab reports nothing", async () => {
    const onChange = vi.fn();
    await render(<Example defaultValue="billing" onChange={onChange} />);
    await userEvent.click(page.getByRole("tab", { name: "Billing" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  test("choosing the first tab when an unmatched value fell back to it reports nothing", async () => {
    const onChange = vi.fn();
    await render(<Example value="missing" onChange={onChange} />);
    await userEvent.click(page.getByRole("tab", { name: "Profile" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  test("setting the value programmatically reports nothing", async () => {
    const onChange = vi.fn();
    const screen = await render(<Example value="profile" onChange={onChange} />);
    await screen.rerender(<Example value="billing" onChange={onChange} />);
    expect(selectedLabel()).toEqual(["Billing"]);
    await screen.rerender(<Example value="missing" onChange={onChange} />);
    expect(selectedLabel()).toEqual(["Profile"]);
    expect(onChange).not.toHaveBeenCalled();
  });

  test("the initial fallback to the first section reports nothing", async () => {
    const onChange = vi.fn();
    await render(<Example defaultValue="missing" onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
  });

  test("a controlled value follows onChange", async () => {
    function Controlled() {
      const [value, setValue] = useState("profile");
      return (
        <>
          <Example value={value} onChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    await render(<Controlled />);
    await userEvent.click(page.getByRole("tab", { name: "Billing" }));
    expect(document.querySelector("output")?.textContent).toBe("billing");
    expect(selectedLabel()).toEqual(["Billing"]);
  });
});

describe("component.tabs#keyboard-tabs (MUST)", () => {
  test("Tab enters the tab list at the selected tab", async () => {
    await render(<Example defaultValue="notifications" />);
    await tabIntoList();
    expect(document.activeElement?.textContent).toBe("Notifications");
    // Only the selected tab is in the tab sequence.
    expect(tabs().map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
  });

  test("Tab leaves the tab list for the panel", async () => {
    await render(<Example />);
    await tabIntoList();
    await userEvent.tab();
    expect(document.activeElement?.getAttribute("role")).toBe("tabpanel");
  });

  test("arrow keys move focus and selection, wrapping at either end", async () => {
    await render(<Example />);
    await tabIntoList();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement?.textContent).toBe("Notifications");
    expect(selectedLabel()).toEqual(["Notifications"]);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(selectedLabel()).toEqual(["Profile"]);
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement?.textContent).toBe("Billing");
    expect(selectedLabel()).toEqual(["Billing"]);
  });

  test("Home and End move to the first and last tab", async () => {
    await render(<Example defaultValue="notifications" />);
    await tabIntoList();
    await userEvent.keyboard("{End}");
    expect(document.activeElement?.textContent).toBe("Billing");
    expect(selectedLabel()).toEqual(["Billing"]);
    await userEvent.keyboard("{Home}");
    expect(document.activeElement?.textContent).toBe("Profile");
    expect(selectedLabel()).toEqual(["Profile"]);
  });

  test("arrow keys follow the reading direction in a right-to-left page", async () => {
    await render(
      <div dir="rtl">
        <Example />
      </div>,
    );
    await tabIntoList();
    await userEvent.keyboard("{ArrowLeft}");
    expect(selectedLabel()).toEqual(["Notifications"]);
    await userEvent.keyboard("{ArrowRight}");
    expect(selectedLabel()).toEqual(["Profile"]);
  });
});

describe("component.tabs#panel-reachable (MUST)", () => {
  test("a panel with nothing focusable is the next keyboard stop", async () => {
    await render(<Example />);
    expect(panels()[0].tabIndex).toBe(0);
    await tabIntoList();
    await userEvent.tab();
    expect(document.activeElement).toBe(panels()[0]);
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe("After");
  });

  test("a panel holding a focusable control reaches it next", async () => {
    await render(<Example focusableInPanel />);
    await tabIntoList();
    await userEvent.tab();
    // React Aria drops the panel from the tab order when it has tabbable content.
    expect(document.activeElement?.textContent).toBe("Edit profile");
  });
});

describe("component.tabs#accessible-tabs (MUST)", () => {
  test("the tab list is named by accessibleName", async () => {
    await render(<Example />);
    await expect
      .element(page.getByRole("tablist", { name: "Account settings" }))
      .toBeInTheDocument();
  });

  test("each tab exposes its label and whether it is selected", async () => {
    await render(<Example defaultValue="billing" />);
    await expect
      .element(page.getByRole("tab", { name: "Profile" }))
      .toHaveAttribute("aria-selected", "false");
    await expect
      .element(page.getByRole("tab", { name: "Billing" }))
      .toHaveAttribute("aria-selected", "true");
  });

  test("the panel is named by the selected tab", async () => {
    await render(<Example defaultValue="billing" />);
    await expect.element(page.getByRole("tabpanel", { name: "Billing" })).toBeInTheDocument();
    const panel = panels()[0];
    const tab = page.getByRole("tab", { name: "Billing" }).element();
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
    expect(tab.getAttribute("aria-controls")).toBe(panel.id);
  });
});

describe("component.tabs#forced-colors (MUST)", () => {
  afterEach(async () => {
    await cdp().send("Emulation.setEmulatedMedia", { features: [] });
  });

  const indicator = (tab: Element) => getComputedStyle(tab, "::after");

  test("the selected tab carries an indicator mark, not color alone", async () => {
    await render(<Example />);
    const [selected, other] = tabs();
    expect(indicator(selected).content).not.toBe("none");
    expect(parseFloat(indicator(selected).height)).toBeGreaterThan(0);
    expect(indicator(other).content).toBe("none");
  });

  test("indicator and focus ring stay visible under forced colors", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    await render(<Example />);
    await tabIntoList();
    const selected = selectedTabs()[0];
    const probe = document.createElement("span");
    probe.style.color = "Highlight";
    document.body.append(probe);
    const highlight = getComputedStyle(probe).color;
    probe.remove();
    expect(indicator(selected).backgroundColor).toBe(highlight);
    expect(parseFloat(indicator(selected).height)).toBeGreaterThan(0);
    const ring = getComputedStyle(selected);
    expect(ring.outlineStyle).toBe("solid");
    expect(parseFloat(ring.outlineWidth)).toBeGreaterThan(0);
    expect(ring.outlineColor).toBe(highlight);
  });
});

describe("component.tabs#labels-short-and-unique (MUST)", () => {
  test("warns when labels or values repeat", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(
      <Tabs accessibleName="Settings">
        <TabsSection value="a" label="Same">
          A
        </TabsSection>
        <TabsSection value="a" label="Same">
          B
        </TabsSection>
      </Tabs>,
    );
    expect(warn.mock.calls.flat().join("\n")).toMatch(/label "Same" is used more than once/);
    expect(warn.mock.calls.flat().join("\n")).toMatch(/value "a" is used more than once/);
    warn.mockRestore();
  });

  test("warns when the set has no accessible name", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Example accessibleName="" />);
    expect(warn.mock.calls.flat().join("\n")).toMatch(/accessibleName is empty/);
    warn.mockRestore();
  });
});

describe("component.tabs#few-tabs (SHOULD)", () => {
  test("a row that overflows scrolls sideways instead of wrapping", async () => {
    await render(
      <div style={{ width: "160px" }}>
        <Example />
      </div>,
    );
    const list = document.querySelector<HTMLElement>('[role="tablist"]')!;
    expect(getComputedStyle(list).overflowX).toBe("auto");
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    const tops = new Set(tabs().map((t) => t.getBoundingClientRect().top));
    expect(tops.size).toBe(1);
  });
});

describe("token bindings", () => {
  const resolve = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const asColor = (value: string) => {
    const probe = document.createElement("span");
    probe.style.color = value;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  };

  test("tab base: muted foreground, label typography, space padding", async () => {
    await render(<Example />);
    const tab = getComputedStyle(tabs()[1]);
    expect(tab.color).toBe(asColor(resolve("--ds-semantic-color-foreground-muted")));
    expect(tab.fontSize).toBe(resolve("--ds-semantic-typography-label-md-font-size"));
    expect(tab.fontWeight).toBe(resolve("--ds-semantic-typography-label-md-font-weight"));
    expect(tab.paddingLeft).toBe(resolve("--ds-primitives-space-3"));
    expect(tab.paddingTop).toBe(resolve("--ds-primitives-space-2"));
    expect(tab.borderTopLeftRadius).toBe(resolve("--ds-semantic-radius-control"));
  });

  test("tab selected: default foreground; indicator uses the primary action fill", async () => {
    await render(<Example />);
    const selected = tabs()[0];
    expect(getComputedStyle(selected).color).toBe(
      asColor(resolve("--ds-semantic-color-foreground-default")),
    );
    expect(getComputedStyle(selected, "::after").backgroundColor).toBe(
      asColor(resolve("--ds-semantic-color-background-action-primary-default")),
    );
  });

  test("tab hover: tertiary hover background and default foreground", async () => {
    await render(<Example />);
    await userEvent.hover(page.getByRole("tab", { name: "Billing" }));
    const tab = getComputedStyle(tabs()[2]);
    expect(tab.backgroundColor).toBe(
      asColor(resolve("--ds-semantic-color-background-action-tertiary-hover")),
    );
    expect(tab.color).toBe(asColor(resolve("--ds-semantic-color-foreground-default")));
  });

  test("tab focus and panel focus: focus ring color", async () => {
    await render(<Example />);
    await tabIntoList();
    const focus = asColor(resolve("--ds-semantic-color-border-focus"));
    expect(getComputedStyle(tabs()[0]).outlineColor).toBe(focus);
    await userEvent.tab();
    expect(getComputedStyle(panels()[0]).outlineColor).toBe(focus);
  });

  test("tab-list: subtle border and space gap; panel: vertical padding", async () => {
    await render(<Example />);
    const list = getComputedStyle(document.querySelector('[role="tablist"]')!);
    expect(list.borderBottomColor).toBe(asColor(resolve("--ds-semantic-color-border-subtle")));
    expect(list.columnGap).toBe(resolve("--ds-primitives-space-1"));
    expect(getComputedStyle(panels()[0]).paddingTop).toBe(resolve("--ds-primitives-space-4"));
  });
});
