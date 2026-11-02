import { useState, type FormEvent } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button, type ButtonVariant } from "../src/button/Button";

const variants: ButtonVariant[] = ["primary", "secondary", "tertiary", "destructive"];

const button = () => document.querySelector<HTMLButtonElement>(".ds-button")!;
const buttons = () => Array.from(document.querySelectorAll<HTMLButtonElement>(".ds-button"));

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
const tokenColor = (name: string) => asColor(resolve(name));
const TRANSPARENT = "rgba(0, 0, 0, 0)";

/** Focus a preceding button and press Tab, so focus arrives by keyboard. */
async function tabToButton() {
  page.getByRole("button", { name: "Before" }).element().focus();
  await userEvent.tab();
}

const SearchIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
    <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" />
  </svg>
);

afterEach(async () => {
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});

describe("component.button#disabled-prevents-activation (MUST)", () => {
  test("pointer activation of a disabled button reports nothing", async () => {
    const onActivate = vi.fn();
    await render(
      <Button disabled onActivate={onActivate}>
        Save changes
      </Button>,
    );
    await userEvent.click(page.getByRole("button", { name: "Save changes" }), { force: true });
    expect(onActivate).not.toHaveBeenCalled();
  });

  test("a disabled button is exposed as disabled and leaves the tab order", async () => {
    await render(
      <>
        <button type="button">Before</button>
        <Button disabled>Save changes</Button>
        <button type="button">After</button>
      </>,
    );
    await expect.element(page.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await tabToButton();
    expect(document.activeElement?.textContent).toBe("After");
  });

  test("a disabled submit button does not submit its form", async () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    await render(
      <form onSubmit={onSubmit}>
        <Button action="submit" disabled>
          Save changes
        </Button>
      </form>,
    );
    button().click();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("an enabled button reports activate on click, Enter, and Space", async () => {
    const onActivate = vi.fn();
    await render(
      <>
        <button type="button">Before</button>
        <Button onActivate={onActivate}>Save changes</Button>
      </>,
    );
    await userEvent.click(page.getByRole("button", { name: "Save changes" }));
    expect(onActivate).toHaveBeenCalledTimes(1);
    await tabToButton();
    await userEvent.keyboard("{Enter}");
    expect(onActivate).toHaveBeenCalledTimes(2);
    await userEvent.keyboard(" ");
    expect(onActivate).toHaveBeenCalledTimes(3);
  });
});

describe("component.button#explicit-form-action (SHOULD)", () => {
  test("the default activate action neither submits nor resets its form", async () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    const onReset = vi.fn();
    const onActivate = vi.fn();
    await render(
      <form onSubmit={onSubmit} onReset={onReset}>
        <Button onActivate={onActivate}>Preview</Button>
      </form>,
    );
    expect(button().type).toBe("button");
    await userEvent.click(page.getByRole("button", { name: "Preview" }));
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onReset).not.toHaveBeenCalled();
  });
});

describe("component.button#form-submit-reset (SHOULD)", () => {
  test("submit submits the button's form", async () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    await render(
      <form onSubmit={onSubmit}>
        <Button action="submit">Save changes</Button>
      </form>,
    );
    await userEvent.click(page.getByRole("button", { name: "Save changes" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("reset restores the form's initial values", async () => {
    await render(
      <form>
        <input aria-label="Name" defaultValue="Ada" />
        <Button action="reset" variant="secondary">
          Reset form
        </Button>
      </form>,
    );
    const input = page.getByRole("textbox", { name: "Name" });
    await userEvent.clear(input);
    await userEvent.type(input, "Grace");
    expect((input.element() as HTMLInputElement).value).toBe("Grace");
    await userEvent.click(page.getByRole("button", { name: "Reset form" }));
    expect((input.element() as HTMLInputElement).value).toBe("Ada");
  });
});

describe("component.button#visible-focus (MUST)", () => {
  test.each(variants)("keyboard focus draws a focus ring on %s", async (variant) => {
    await render(
      <>
        <button type="button">Before</button>
        <Button variant={variant}>Save changes</Button>
      </>,
    );
    await tabToButton();
    expect(document.activeElement).toBe(button());
    const style = getComputedStyle(button());
    expect(style.outlineStyle).toBe("solid");
    expect(parseFloat(style.outlineWidth)).toBeGreaterThan(0);
    expect(style.outlineColor).toBe(tokenColor("--ds-semantic-color-border-focus"));
  });

  test("the focus ring stays visible under forced colors", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    await render(
      <>
        <button type="button">Before</button>
        <Button variant="tertiary">View details</Button>
      </>,
    );
    await tabToButton();
    const style = getComputedStyle(button());
    expect(style.outlineStyle).toBe("solid");
    expect(parseFloat(style.outlineWidth)).toBeGreaterThan(0);
    expect(style.outlineColor).toBe(asColor("Highlight"));
  });
});

describe("component.button#icon-accessible-name (MUST)", () => {
  test("accessibleName names an icon-only button", async () => {
    await render(
      <Button accessibleName="Search" variant="tertiary">
        <SearchIcon />
      </Button>,
    );
    await expect.element(page.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(button().getAttribute("aria-label")).toBe("Search");
  });

  test("visible text names the button when accessibleName is absent", async () => {
    await render(
      <Button>
        <SearchIcon />
        Search
      </Button>,
    );
    await expect.element(page.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(button().hasAttribute("aria-label")).toBe(false);
  });

  test("warns when an icon-only button has no accessibleName", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(
      <Button>
        <SearchIcon />
      </Button>,
    );
    expect(warn.mock.calls.flat().join("\n")).toMatch(/no visible text and no accessibleName/);
    warn.mockRestore();
  });

  test("does not warn when the button has visible text", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Button>Save changes</Button>);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("component.button#not-color-alone (MUST)", () => {
  test("the disabled state is exposed to assistive technology, not only by color", async () => {
    await render(<Button disabled>Save changes</Button>);
    expect(button().disabled).toBe(true);
  });

  test.each(variants)("%s keeps a visible boundary under forced colors", async (variant) => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    await render(<Button variant={variant}>Save changes</Button>);
    const style = getComputedStyle(button());
    expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
    expect(style.borderTopColor).not.toBe(TRANSPARENT);
  });

  test("disabled reads as GrayText under forced colors", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    await render(<Button disabled>Save changes</Button>);
    expect(getComputedStyle(button()).color).toBe(asColor("GrayText"));
  });
});

describe("parameters", () => {
  test("defaults: primary, medium, activate, enabled, not full width", async () => {
    await render(<Button>Save changes</Button>);
    const el = button();
    expect(el.className).toContain("ds-button--primary");
    expect(el.className).toContain("ds-button--medium");
    expect(el.type).toBe("button");
    expect(el.disabled).toBe(false);
    expect(el.className).not.toContain("ds-button--full-width");
  });

  test("fullWidth fills the available inline size", async () => {
    await render(
      <div style={{ width: "400px" }}>
        <Button fullWidth>Save changes</Button>
        <Button>Cancel</Button>
      </div>,
    );
    const [full, auto] = buttons();
    expect(full.getBoundingClientRect().width).toBe(400);
    expect(auto.getBoundingClientRect().width).toBeLessThan(400);
  });

  test("className and ref reach the native button", async () => {
    let node: HTMLButtonElement | null = null;
    await render(
      <Button className="extra" ref={(el) => void (node = el)}>
        Save changes
      </Button>,
    );
    expect(node).toBe(button());
    expect(button().classList.contains("extra")).toBe(true);
  });

  test("a controlled counter updates from onActivate", async () => {
    function Counter() {
      const [count, setCount] = useState(0);
      return <Button onActivate={() => setCount((c) => c + 1)}>Add one ({count})</Button>;
    }
    await render(<Counter />);
    await userEvent.click(page.getByRole("button"));
    expect(button().textContent).toBe("Add one (1)");
  });
});

describe("reducedMotion.reduce", () => {
  test("color transitions use the fast duration and are removed when motion is reduced", async () => {
    await render(<Button>Save changes</Button>);
    expect(getComputedStyle(button()).transitionDuration).toBe(
      `${parseFloat(resolve("--ds-primitives-duration-fast")) / 1000}s`,
    );
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    expect(getComputedStyle(button()).transitionDuration).toBe("0s");
  });
});

describe("token bindings", () => {
  const colors = (el: Element) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, foreground: s.color, border: s.borderTopColor };
  };

  test("control base: radius, gap, label typography, motion easing", async () => {
    await render(
      <Button>
        <SearchIcon />
        Search
      </Button>,
    );
    const s = getComputedStyle(button());
    expect(s.borderTopLeftRadius).toBe(resolve("--ds-semantic-radius-control"));
    expect(s.columnGap).toBe(resolve("--ds-primitives-space-2"));
    expect(s.fontSize).toBe(resolve("--ds-semantic-typography-label-md-font-size"));
    expect(s.fontWeight).toBe(resolve("--ds-semantic-typography-label-md-font-weight"));
    expect(s.fontFamily.replaceAll('"', "'")).toBe(
      resolve("--ds-semantic-typography-label-md-font-family").replaceAll('"', "'"),
    );
    expect(s.transitionTimingFunction).toBe(resolve("--ds-primitives-ease-out"));
    // The gap separates icon and label: the content wrapper does not create a box.
    const [icon] = button().querySelectorAll("svg");
    const range = document.createRange();
    range.selectNodeContents(button().querySelector(".ds-button__content")!.lastChild!);
    const gap = range.getBoundingClientRect().left - icon.getBoundingClientRect().right;
    expect(gap).toBeCloseTo(parseFloat(resolve("--ds-primitives-space-2")), 0);
  });

  test("size.medium and size.small padding", async () => {
    await render(
      <>
        <Button>Medium</Button>
        <Button size="small">Small</Button>
      </>,
    );
    const [medium, small] = buttons().map((el) => getComputedStyle(el));
    expect(medium.paddingTop).toBe(resolve("--ds-primitives-space-3"));
    expect(medium.paddingLeft).toBe(resolve("--ds-primitives-space-4"));
    expect(small.paddingTop).toBe(resolve("--ds-primitives-space-2"));
    expect(small.paddingLeft).toBe(resolve("--ds-primitives-space-3"));
  });

  const base = {
    primary: {
      background: "--ds-semantic-color-background-action-primary-default",
      foreground: "--ds-semantic-color-foreground-on-action-primary",
      border: "--ds-semantic-color-border-action-primary-default",
    },
    secondary: {
      background: "--ds-semantic-color-background-action-secondary-default",
      foreground: "--ds-semantic-color-foreground-default",
      border: "--ds-semantic-color-border-default",
    },
    tertiary: {
      background: "transparent",
      foreground: "--ds-semantic-color-foreground-default",
      border: "transparent",
    },
    destructive: {
      background: "--ds-semantic-color-background-action-destructive-default",
      foreground: "--ds-semantic-color-foreground-on-action-destructive",
      border: "--ds-semantic-color-border-action-destructive-default",
    },
  } as const;
  const expected = (token: string) => (token === "transparent" ? TRANSPARENT : tokenColor(token));

  test.each(variants)("variant.%s: background, foreground, border", async (variant) => {
    await render(<Button variant={variant}>Save changes</Button>);
    const b = base[variant];
    expect(colors(button())).toEqual({
      background: expected(b.background),
      foreground: expected(b.foreground),
      border: expected(b.border),
    });
  });

  const hover = {
    primary: ["primary-hover", "--ds-semantic-color-border-action-primary-hover"],
    secondary: ["secondary-hover", "--ds-semantic-color-border-default"],
    tertiary: ["tertiary-hover", "transparent"],
    destructive: ["destructive-hover", "--ds-semantic-color-border-action-destructive-hover"],
  } as const;

  test.each(variants)("variant.%s + hover", async (variant) => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await render(<Button variant={variant}>Save changes</Button>);
    await userEvent.hover(page.getByRole("button"));
    expect(button().hasAttribute("data-hovered")).toBe(true);
    const [bg, border] = hover[variant];
    const c = colors(button());
    expect(c.background).toBe(tokenColor(`--ds-semantic-color-background-action-${bg}`));
    expect(c.border).toBe(expected(border));
  });

  test.each(variants)("variant.%s + pressed", async (variant) => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await render(
      <>
        <button type="button">Before</button>
        <Button variant={variant}>Save changes</Button>
      </>,
    );
    await tabToButton();
    // Hold Space down: React Aria keeps the pressed state until the key is released.
    await userEvent.keyboard("[Space>]");
    expect(button().hasAttribute("data-pressed")).toBe(true);
    const c = colors(button());
    expect(c.background).toBe(
      tokenColor(`--ds-semantic-color-background-action-${variant}-pressed`),
    );
    if (variant === "primary" || variant === "destructive") {
      expect(c.border).toBe(tokenColor(`--ds-semantic-color-border-action-${variant}-pressed`));
    }
    await userEvent.keyboard("[/Space]");
  });

  const disabled = {
    primary: ["--ds-semantic-color-background-disabled", "--ds-semantic-color-border-disabled"],
    secondary: ["transparent", "--ds-semantic-color-border-disabled"],
    tertiary: ["transparent", "transparent"],
    destructive: ["--ds-semantic-color-background-disabled", "--ds-semantic-color-border-disabled"],
  } as const;

  test.each(variants)("variant.%s + disabled", async (variant) => {
    await render(
      <Button variant={variant} disabled>
        Save changes
      </Button>,
    );
    const [bg, border] = disabled[variant];
    expect(colors(button())).toEqual({
      background: expected(bg),
      foreground: tokenColor("--ds-semantic-color-foreground-disabled"),
      border: expected(border),
    });
  });
});
