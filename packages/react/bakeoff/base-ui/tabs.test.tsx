import { describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Tabs, TabSection, type TabsProps } from "./Tabs";

function Example(props: Partial<TabsProps>) {
  return (
    <>
      <button type="button">Before</button>
      <Tabs accessibleName="Settings" {...props}>
        <TabSection value="profile" label="Profile">
          Profile text
        </TabSection>
        <TabSection value="notifications" label="Notifications">
          Notifications text
        </TabSection>
        <TabSection value="billing" label="Billing">
          Billing text
        </TabSection>
      </Tabs>
    </>
  );
}

const tab = (name: string) => page.getByRole("tab", { name });
const selectedTabs = () =>
  page
    .getByRole("tab")
    .elements()
    .filter((el) => el.getAttribute("aria-selected") === "true");
const panels = () => document.querySelectorAll('[role="tabpanel"]');

async function focusBefore() {
  page.getByRole("button", { name: "Before" }).element().focus();
}

describe("component.tabs#one-selected", () => {
  test("exactly one tab is selected and only its panel is in the document", async () => {
    await render(<Example />);
    expect(selectedTabs()).toHaveLength(1);
    expect(panels()).toHaveLength(1);
    await expect.element(page.getByRole("tabpanel")).toHaveTextContent("Profile text");
    await tab("Billing").click();
    expect(selectedTabs()).toHaveLength(1);
    expect(panels()).toHaveLength(1);
    await expect.element(page.getByRole("tabpanel")).toHaveTextContent("Billing text");
  });

  test("an unmatched value selects the first section", async () => {
    await render(<Example value="missing" />);
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "true");
    await expect.element(page.getByRole("tabpanel")).toHaveTextContent("Profile text");
  });

  test("an empty value selects the first section", async () => {
    await render(<Example value="" />);
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "true");
  });

  test("a matching value selects its section", async () => {
    await render(<Example defaultValue="billing" />);
    await expect.element(tab("Billing")).toHaveAttribute("aria-selected", "true");
    await expect.element(page.getByRole("tabpanel")).toHaveTextContent("Billing text");
  });
});

describe("component.tabs#selection-reports-change", () => {
  test("pointer selection of a different tab reports change once", async () => {
    const onChange = vi.fn();
    await render(<Example onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
    await tab("Notifications").click();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("notifications");
  });

  test("keyboard selection reports change", async () => {
    const onChange = vi.fn();
    await render(<Example onChange={onChange} />);
    await focusBefore();
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("notifications");
  });

  test("choosing the already selected tab reports nothing", async () => {
    const onChange = vi.fn();
    await render(<Example onChange={onChange} />);
    await tab("Profile").click();
    expect(onChange).not.toHaveBeenCalled();
  });

  test("setting the value programmatically reports nothing", async () => {
    const onChange = vi.fn();
    const screen = await render(<Example value="profile" onChange={onChange} />);
    await screen.rerender(<Example value="billing" onChange={onChange} />);
    await expect.element(tab("Billing")).toHaveAttribute("aria-selected", "true");
    await screen.rerender(<Example value="missing" onChange={onChange} />);
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "true");
    expect(onChange).not.toHaveBeenCalled();
  });

  test("controlled tabs report change and wait for the new value", async () => {
    const onChange = vi.fn();
    await render(<Example value="profile" onChange={onChange} />);
    await tab("Billing").click();
    expect(onChange).toHaveBeenCalledExactlyOnceWith("billing");
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "true");
  });
});

describe("component.tabs#keyboard-tabs", () => {
  test("Tab enters the tab list at the selected tab", async () => {
    await render(<Example defaultValue="notifications" />);
    await focusBefore();
    await userEvent.tab();
    await expect.element(tab("Notifications")).toHaveFocus();
  });

  test("arrow keys move focus and selection with wrapping", async () => {
    await render(<Example />);
    await focusBefore();
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(tab("Notifications")).toHaveFocus();
    await expect.element(tab("Notifications")).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect.element(tab("Profile")).toHaveFocus();
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(tab("Billing")).toHaveFocus();
    await expect.element(tab("Billing")).toHaveAttribute("aria-selected", "true");
  });

  test("Home and End move to the first and last tab", async () => {
    await render(<Example defaultValue="notifications" />);
    await focusBefore();
    await userEvent.tab();
    await userEvent.keyboard("{End}");
    await expect.element(tab("Billing")).toHaveFocus();
    await expect.element(tab("Billing")).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Home}");
    await expect.element(tab("Profile")).toHaveFocus();
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "true");
  });

  test("arrow keys follow reading direction in right-to-left layouts", async () => {
    await render(
      <div dir="rtl">
        <Example />
      </div>,
    );
    await focusBefore();
    await userEvent.tab();
    await userEvent.keyboard("{ArrowLeft}");
    await expect.element(tab("Notifications")).toHaveFocus();
    await expect.element(tab("Notifications")).toHaveAttribute("aria-selected", "true");
  });
});

describe("component.tabs#panel-reachable", () => {
  test("the panel is the next keyboard stop after the tab list", async () => {
    await render(<Example />);
    await focusBefore();
    await userEvent.tab();
    await userEvent.tab();
    await expect.element(page.getByRole("tabpanel")).toHaveFocus();
  });
});

describe("component.tabs#accessible-tabs", () => {
  test("names the tab list, the tabs, and the panel", async () => {
    await render(<Example defaultValue="notifications" />);
    await expect.element(page.getByRole("tablist", { name: "Settings" })).toBeInTheDocument();
    for (const name of ["Profile", "Notifications", "Billing"]) {
      await expect.element(tab(name)).toBeInTheDocument();
    }
    await expect.element(tab("Notifications")).toHaveAttribute("aria-selected", "true");
    await expect.element(tab("Profile")).toHaveAttribute("aria-selected", "false");
    await expect
      .element(page.getByRole("tabpanel", { name: "Notifications" }))
      .toHaveTextContent("Notifications text");
  });
});

describe("component.tabs#forced-colors", () => {
  test("the selected tab is marked by an indicator, not color alone", async () => {
    await render(<Example />);
    const indicator = document.querySelector<HTMLElement>(".ds-tabs__indicator");
    expect(indicator).not.toBeNull();
    await expect.poll(() => indicator!.getBoundingClientRect().height).toBeGreaterThan(0);
    const tabRect = tab("Profile").element().getBoundingClientRect();
    await expect.poll(() => indicator!.getBoundingClientRect().left).toBeCloseTo(tabRect.left, 0);
    expect(indicator!.getBoundingClientRect().width).toBeCloseTo(tabRect.width, 0);
  });

  test("forced colors keep the indicator and focus rings in system colors", async () => {
    await render(<Example />);
    const rules = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule)
      .filter((rule) => rule.conditionText.includes("forced-colors: active"))
      .map((rule) => rule.cssText)
      .join("\n");
    expect(rules).toMatch(/\.ds-tabs__indicator[^}]*highlight/i);
    expect(rules).toMatch(/\.ds-tabs__tab:focus-visible[\s\S]*outline-color: highlight/i);
  });
});

describe("component.tabs#labels-short-and-unique", () => {
  test("warns when two tabs share a label", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(
      <Tabs accessibleName="Settings">
        <TabSection value="a" label="Settings">
          A
        </TabSection>
        <TabSection value="b" label="Settings">
          B
        </TabSection>
      </Tabs>,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("labels-short-and-unique"));
    warn.mockRestore();
  });

  test("warns when the set has no accessible name", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Example accessibleName="" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("accessibleName"));
    warn.mockRestore();
  });
});

describe("component.tabs#few-tabs", () => {
  test("a row that overflows scrolls sideways", async () => {
    await render(
      <div style={{ width: "200px" }}>
        <Tabs accessibleName="Many">
          {Array.from({ length: 10 }, (_, i) => (
            <TabSection key={i} value={`v${i}`} label={`Section ${i}`}>
              {i}
            </TabSection>
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

describe("tokens", () => {
  test("tab base binds label typography, muted color, and spacing primitives", async () => {
    await render(<Example />);
    const style = getComputedStyle(tab("Notifications").element());
    expect(style.color).toBe("rgb(95, 95, 95)");
    expect(style.fontSize).toBe("14px");
    expect(style.fontWeight).toBe("500");
    expect(style.paddingTop).toBe("8px");
    expect(style.paddingLeft).toBe("12px");
    expect(style.borderTopLeftRadius).toBe("10px");
  });

  test("tab-list gap and border, panel padding", async () => {
    await render(<Example />);
    const list = getComputedStyle(page.getByRole("tablist").element());
    expect(list.columnGap).toBe("4px");
    expect(list.borderBottomColor).toBe("rgb(213, 213, 213)");
    const panel = getComputedStyle(page.getByRole("tabpanel").element());
    expect(panel.paddingTop).toBe("16px");
  });

  test("selected tab and indicator", async () => {
    await render(<Example />);
    expect(getComputedStyle(tab("Profile").element()).color).toBe("rgb(23, 23, 23)");
    const indicator = document.querySelector(".ds-tabs__indicator")!;
    expect(getComputedStyle(indicator).backgroundColor).toBe("rgb(160, 80, 29)");
  });

  test("hover binds tertiary action hover background and default foreground", async () => {
    await render(<Example />);
    await tab("Billing").hover();
    const style = getComputedStyle(tab("Billing").element());
    expect(style.backgroundColor).toBe("rgba(23, 23, 23, 0.05)");
    expect(style.color).toBe("rgb(23, 23, 23)");
  });

  test("keyboard focus binds the focus border color", async () => {
    await render(<Example />);
    await focusBefore();
    await userEvent.tab();
    expect(getComputedStyle(tab("Profile").element()).outlineColor).toBe("rgb(160, 80, 29)");
    await userEvent.tab();
    expect(getComputedStyle(page.getByRole("tabpanel").element()).outlineColor).toBe(
      "rgb(160, 80, 29)",
    );
  });
});
