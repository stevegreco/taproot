import { useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Tabs, TabsSection } from "./Tabs";

type Props = Partial<React.ComponentProps<typeof Tabs>>;

function Example(props: Props) {
  return (
    <>
      <button type="button">Before</button>
      <Tabs accessibleName="Account settings" {...props}>
        <TabsSection value="profile" label="Profile">
          Profile content
        </TabsSection>
        <TabsSection value="notifications" label="Notifications">
          Notifications content
        </TabsSection>
        <TabsSection value="billing" label="Billing">
          Billing content
        </TabsSection>
      </Tabs>
      <button type="button">After</button>
    </>
  );
}

const tab = (name: string) => page.getByRole("tab", { name });
const tabEl = (name: string) => tab(name).element() as HTMLElement;
const panel = () => page.getByRole("tabpanel");
const selectedTabs = () =>
  Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"]'));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("component.tabs#one-selected", () => {
  test("selects the first section when no value is given", async () => {
    await render(<Example />);
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "true");
    expect(selectedTabs()).toHaveLength(1);
    await expect.element(panel()).toHaveTextContent("Profile content");
  });

  test("selects the first section when the value matches nothing", async () => {
    await render(<Example value="nope" />);
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "true");
    expect(selectedTabs()).toHaveLength(1);
  });

  test("shows and exposes only the selected panel", async () => {
    await render(<Example defaultValue="billing" />);
    expect(document.querySelectorAll('[role="tabpanel"]')).toHaveLength(1);
    await expect.element(panel()).toHaveTextContent("Billing content");
    await expect.element(page.getByText("Profile content")).not.toBeInTheDocument();
  });
});

describe("component.tabs#selection-reports-change", () => {
  test("reports change on pointer selection", async () => {
    const onChange = vi.fn();
    await render(<Example onChange={onChange} />);
    await tab("Billing").click();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("billing");
    await expect.element(panel()).toHaveTextContent("Billing content");
  });

  test("reports change on keyboard selection", async () => {
    const onChange = vi.fn();
    await render(<Example onChange={onChange} />);
    tabEl("Profile").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("notifications");
  });

  test("reports nothing when choosing the already selected tab", async () => {
    const onChange = vi.fn();
    await render(<Example onChange={onChange} />);
    await tab("Profile").click();
    expect(onChange).not.toHaveBeenCalled();
  });

  test("reports nothing when the value is set programmatically", async () => {
    const onChange = vi.fn();
    const screen = await render(<Example value="profile" onChange={onChange} />);
    await screen.rerender(<Example value="billing" onChange={onChange} />);
    await expect.element(tab("Billing")).toHaveAttribute("aria-selected", "true");
    expect(onChange).not.toHaveBeenCalled();
  });

  test("controlled value follows the parent", async () => {
    function Controlled() {
      const [value, setValue] = useState("notifications");
      return (
        <>
          <output>{value}</output>
          <Example value={value} onChange={setValue} />
        </>
      );
    }
    await render(<Controlled />);
    await tab("Billing").click();
    await expect.element(page.getByRole("status")).toHaveTextContent("billing");
    await expect.element(tab("Billing")).toHaveAttribute("aria-selected", "true");
  });
});

describe("component.tabs#keyboard-tabs", () => {
  test("Tab enters the tab list at the selected tab and leaves it for the panel", async () => {
    await render(<Example defaultValue="notifications" />);
    (page.getByRole("button", { name: "Before" }).element() as HTMLElement).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(tabEl("Notifications"));
    await userEvent.tab();
    expect(document.activeElement).toBe(panel().element());
  });

  test("arrow keys move focus and selection, wrapping at either end", async () => {
    await render(<Example />);
    tabEl("Profile").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(tabEl("Billing"));
    await expect.element(tab("Billing")).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabEl("Profile"));
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabEl("Notifications"));
    await expect.element(panel()).toHaveTextContent("Notifications content");
  });

  test("Home and End move to the first and last tab", async () => {
    await render(<Example defaultValue="notifications" />);
    tabEl("Notifications").focus();
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(tabEl("Billing"));
    await expect.element(tab("Billing")).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(tabEl("Profile"));
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "true");
  });

  test("arrow keys follow reading direction in right-to-left layouts", async () => {
    await render(
      <div dir="rtl">
        <Example />
      </div>,
    );
    tabEl("Profile").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(tabEl("Notifications"));
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabEl("Profile"));
  });

  test("only the selected tab is in the tab sequence", async () => {
    await render(<Example defaultValue="billing" />);
    expect(tabEl("Billing").tabIndex).toBe(0);
    expect(tabEl("Profile").tabIndex).toBe(-1);
    expect(tabEl("Notifications").tabIndex).toBe(-1);
  });
});

describe("component.tabs#panel-reachable", () => {
  test("the panel is the next stop after the tab list even with nothing focusable", async () => {
    await render(<Example />);
    tabEl("Profile").focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(panel().element());
    await userEvent.tab();
    expect(document.activeElement).toBe(page.getByRole("button", { name: "After" }).element());
  });
});

describe("component.tabs#accessible-tabs", () => {
  test("the tab list is named by accessibleName", async () => {
    await render(<Example />);
    await expect.element(page.getByRole("tablist", { name: "Account settings" })).toBeVisible();
  });

  test("each tab exposes its label and selected state", async () => {
    await render(<Example defaultValue="billing" />);
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "false");
    await expect.element(tab("Billing")).toHaveAttribute("aria-selected", "true");
    await expect.element(tab("Billing")).toHaveAccessibleName("Billing");
  });

  test("the panel is named by the selected tab", async () => {
    await render(<Example defaultValue="notifications" />);
    await expect.element(page.getByRole("tabpanel", { name: "Notifications" })).toBeVisible();
    await tab("Billing").click();
    await expect.element(page.getByRole("tabpanel", { name: "Billing" })).toBeVisible();
    expect(tabEl("Billing").getAttribute("aria-controls")).toBe(panel().element().id);
  });
});

describe("component.tabs#labels-short-and-unique", () => {
  test("warns when two tabs share a label", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(
      <Tabs accessibleName="Views">
        <TabsSection value="a" label="Details" />
        <TabsSection value="b" label="Details" />
      </Tabs>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("duplicate label"));
  });

  test("warns when the set has no accessible name", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(
      <Tabs accessibleName="">
        <TabsSection value="a" label="One" />
      </Tabs>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("accessibleName"));
  });

  test("does not warn for short unique labels", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Example />);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("component.tabs#few-tabs", () => {
  test("a row that overflows scrolls sideways", async () => {
    await render(
      <div style={{ width: "200px" }}>
        <Tabs accessibleName="Many">
          {Array.from({ length: 10 }, (_, i) => (
            <TabsSection key={i} value={`v${i}`} label={`Section ${i}`} />
          ))}
        </Tabs>
      </div>,
    );
    const list = page.getByRole("tablist").element() as HTMLElement;
    expect(getComputedStyle(list).overflowX).toBe("auto");
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    expect(list.getBoundingClientRect().height).toBeLessThan(60);
  });
});

describe("component.tabs#forced-colors", () => {
  test("the selected tab has an indicator shape, not only a color", async () => {
    await render(<Example />);
    const on = getComputedStyle(tabEl("Profile"), "::after");
    const off = getComputedStyle(tabEl("Billing"), "::after");
    expect(parseFloat(on.height)).toBeGreaterThan(0);
    expect(on.backgroundColor).toBe("rgb(160, 80, 29)");
    expect(off.content).toBe("none");
  });

  test("indicator and focus stay visible under forced colors", async () => {
    const session = cdp();
    await session.send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    try {
      expect(matchMedia("(forced-colors: active)").matches).toBe(true);
      await render(<Example />);
      const indicator = getComputedStyle(tabEl("Profile"), "::after");
      expect(parseFloat(indicator.height)).toBeGreaterThan(0);
      expect(indicator.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      // Highlight differs from the Canvas the tab sits on.
      expect(indicator.backgroundColor).not.toBe(getComputedStyle(document.body).backgroundColor);
      (page.getByRole("button", { name: "Before" }).element() as HTMLElement).focus();
      await userEvent.tab();
      const focused = getComputedStyle(tabEl("Profile"));
      expect(focused.outlineStyle).toBe("solid");
      expect(parseFloat(focused.outlineWidth)).toBeGreaterThan(0);
    } finally {
      await session.send("Emulation.setEmulatedMedia", { features: [] });
    }
  });
});

describe("tokens", () => {
  test("tab-list base: border and gap", async () => {
    await render(<Example />);
    const list = getComputedStyle(page.getByRole("tablist").element());
    expect(list.borderBottomColor).toBe("rgb(213, 213, 213)");
    expect(list.columnGap).toBe("4px");
  });

  test("tab base: foreground, radius, padding, typography", async () => {
    await render(<Example />);
    const s = getComputedStyle(tabEl("Billing"));
    expect(s.color).toBe("rgb(95, 95, 95)");
    expect(s.borderTopLeftRadius).toBe("10px");
    expect(s.paddingLeft).toBe("12px");
    expect(s.paddingTop).toBe("8px");
    expect(s.fontSize).toBe("14px");
    expect(s.fontWeight).toBe("500");
    expect(s.fontFamily).toContain("Source Sans 3");
  });

  test("tab hover: foreground and background", async () => {
    await render(<Example />);
    await tab("Billing").hover();
    const s = getComputedStyle(tabEl("Billing"));
    expect(s.color).toBe("rgb(23, 23, 23)");
    expect(s.backgroundColor).toBe("rgba(23, 23, 23, 0.05)");
  });

  test("tab selected: foreground", async () => {
    await render(<Example />);
    expect(getComputedStyle(tabEl("Profile")).color).toBe("rgb(23, 23, 23)");
  });

  test("tab and panel focus: focus ring", async () => {
    await render(<Example />);
    (page.getByRole("button", { name: "Before" }).element() as HTMLElement).focus();
    await userEvent.tab();
    expect(getComputedStyle(tabEl("Profile")).outlineColor).toBe("rgb(160, 80, 29)");
    await userEvent.tab();
    const p = getComputedStyle(panel().element());
    expect(p.outlineColor).toBe("rgb(160, 80, 29)");
    expect(p.outlineStyle).toBe("solid");
  });

  test("panel base: vertical padding", async () => {
    await render(<Example />);
    const p = getComputedStyle(panel().element());
    expect(p.paddingTop).toBe("16px");
    expect(p.paddingBottom).toBe("16px");
  });
});
