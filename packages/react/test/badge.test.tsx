import { afterEach, describe, expect, test, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Badge, type BadgeVariant } from "../src/badge/Badge";

const badge = () => document.querySelector<HTMLElement>(".ds-badge")!;

const Dot = () => (
  <svg viewBox="0 0 10 10" data-testid="dot">
    <circle cx="5" cy="5" r="5" fill="currentColor" />
  </svg>
);

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.dataset.theme = "light";
});

describe("guideline.accessibility#not-a-control (MUST)", () => {
  test("is not focusable and has no interactive role", async () => {
    await render(
      <>
        <button type="button">Before</button>
        <Badge variant="success">Active</Badge>
        <button type="button">After</button>
      </>,
    );
    const el = badge();
    expect(el.tabIndex).toBe(-1);
    expect(el.hasAttribute("tabindex")).toBe(false);
    expect(el.getAttribute("role")).toBeNull();
    expect(el.querySelector("button, a, input, [tabindex]")).toBeNull();

    page.getByRole("button", { name: "Before" }).element().focus();
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe("After");
  });

  test("clicking it does not move focus to it", async () => {
    await render(<Badge>Draft</Badge>);
    await userEvent.click(page.getByText("Draft"));
    expect(badge().contains(document.activeElement)).toBe(false);
  });

  test("has no pointer or action affordance", async () => {
    await render(<Badge>Draft</Badge>);
    expect(getComputedStyle(badge()).cursor).not.toBe("pointer");
  });
});

describe("component.badge#not-color-alone (MUST)", () => {
  test("the visible text is the accessible text; the icon is hidden", async () => {
    await render(
      <Badge variant="danger" icon={<Dot />}>
        Failed
      </Badge>,
    );
    await expect.element(page.getByText("Failed")).toBeVisible();
    expect(badge().textContent).toBe("Failed");
    const icon = badge().querySelector(".ds-badge__icon")!;
    expect(icon.getAttribute("aria-hidden")).toBe("true");
  });

  test("each variant keeps its text; color is not the only difference", async () => {
    const labels: Record<BadgeVariant, string> = {
      default: "Default",
      accent: "Accent",
      success: "Active",
      danger: "Failed",
      warning: "Pending",
      info: "Beta",
    };
    await render(
      <>
        {Object.entries(labels).map(([v, l]) => (
          <Badge key={v} variant={v as BadgeVariant}>
            {l}
          </Badge>
        ))}
      </>,
    );
    const texts = Array.from(document.querySelectorAll(".ds-badge")).map((b) => b.textContent);
    expect(texts).toEqual(Object.values(labels));
  });

  test("warns when the label has no text", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Badge icon={<Dot />}>{""}</Badge>);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("label is empty"));
  });
});

describe("component.badge#no-live-region (MUST)", () => {
  test("sets no live-region role or aria-live", async () => {
    const { rerender } = await render(<Badge variant="warning">Pending</Badge>);
    await rerender(<Badge variant="success">Active</Badge>);
    const all = [badge(), ...badge().querySelectorAll("*")];
    for (const el of all) {
      expect(el.getAttribute("aria-live")).toBeNull();
      expect(["status", "alert", "log", "marquee", "timer"]).not.toContain(el.getAttribute("role"));
    }
  });
});

describe("variant parameter", () => {
  test("defaults to default", async () => {
    await render(<Badge>Draft</Badge>);
    expect(badge().dataset.variant).toBe("default");
  });

  test("an unknown variant falls back to default with a warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Badge variant={"bogus" as BadgeVariant}>Draft</Badge>);
    expect(badge().dataset.variant).toBe("default");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("unknown variant"));
  });

  test("the icon leads the label", async () => {
    await render(<Badge icon={<Dot />}>Beta</Badge>);
    const [first, second] = badge().children;
    expect(first.className).toBe("ds-badge__icon");
    expect(second.textContent).toBe("Beta");
  });

  test("className is added to the root", async () => {
    await render(<Badge className="extra">Beta</Badge>);
    expect(badge().className).toBe("ds-badge extra");
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

  test("surface base: padding, gap, radius, label.sm typography", async () => {
    await render(<Badge icon={<Dot />}>Beta</Badge>);
    const s = getComputedStyle(badge());
    expect(s.paddingTop).toBe(resolve("--ds-primitives-space-1"));
    expect(s.paddingBottom).toBe(resolve("--ds-primitives-space-1"));
    expect(s.paddingLeft).toBe(resolve("--ds-primitives-space-2"));
    expect(s.paddingRight).toBe(resolve("--ds-primitives-space-2"));
    expect(s.columnGap).toBe(resolve("--ds-primitives-space-1"));
    expect(s.borderTopLeftRadius).toBe(resolve("--ds-semantic-radius-pill"));
    expect(s.fontSize).toBe(resolve("--ds-semantic-typography-label-sm-font-size"));
    expect(s.fontWeight).toBe(resolve("--ds-semantic-typography-label-sm-font-weight"));
    expect(s.fontFamily.replace(/["']/g, "")).toBe(
      resolve("--ds-semantic-typography-label-sm-font-family").replace(/["']/g, ""),
    );
    expect(parseFloat(s.lineHeight)).toBeCloseTo(
      parseFloat(resolve("--ds-semantic-typography-label-sm-font-size")) *
        Number(resolve("--ds-semantic-typography-label-sm-line-height")),
    );
  });

  const colorSets: Record<BadgeVariant, [string, string, string]> = {
    default: ["background-muted", "foreground-muted", "border-subtle"],
    accent: ["background-brand-muted", "foreground-brand-default", "border-brand-muted"],
    success: [
      "background-status-success-default",
      "foreground-status-success-default",
      "border-status-success-default",
    ],
    danger: [
      "background-status-danger-default",
      "foreground-status-danger-default",
      "border-status-danger-default",
    ],
    warning: [
      "background-status-warning-default",
      "foreground-status-warning-default",
      "border-status-warning-default",
    ],
    info: [
      "background-status-info-default",
      "foreground-status-info-default",
      "border-status-info-default",
    ],
  };

  for (const theme of ["light", "dark"] as const) {
    for (const [variant, [bg, fg, border]] of Object.entries(colorSets)) {
      test(`surface variant.${variant} (${theme}): background, foreground, border`, async () => {
        document.documentElement.dataset.theme = theme;
        await render(<Badge variant={variant as BadgeVariant}>Label</Badge>);
        const s = getComputedStyle(badge());
        expect(s.backgroundColor).toBe(asColor(resolve(`--ds-semantic-color-${bg}`)));
        expect(s.color).toBe(asColor(resolve(`--ds-semantic-color-${fg}`)));
        expect(s.borderTopColor).toBe(asColor(resolve(`--ds-semantic-color-${border}`)));
        expect(s.borderTopStyle).toBe("solid");
      });
    }
  }

  test("dark theme resolves to different colors than light", async () => {
    await render(<Badge variant="success">Active</Badge>);
    const light = getComputedStyle(badge()).backgroundColor;
    document.documentElement.dataset.theme = "dark";
    const dark = getComputedStyle(badge()).backgroundColor;
    expect(dark).not.toBe(light);
  });

  test("the icon paints in the label color at the label size", async () => {
    await render(
      <Badge variant="info" icon={<Dot />}>
        Beta
      </Badge>,
    );
    const icon = badge().querySelector<HTMLElement>(".ds-badge__icon")!;
    expect(getComputedStyle(icon).color).toBe(getComputedStyle(badge()).color);
    expect(icon.getBoundingClientRect().width).toBeCloseTo(
      parseFloat(resolve("--ds-semantic-typography-label-sm-font-size")),
    );
  });
});
