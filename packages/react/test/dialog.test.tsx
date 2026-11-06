import { useRef, useState } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../src/button/Button";
import { Dialog, type DialogProps } from "../src/dialog/Dialog";

/** A page with a trigger that opens a controlled dialog with Cancel and Delete actions. */
function Example({
  onClose,
  onCancel,
  ...props
}: Partial<Omit<DialogProps, "open" | "onOpenChange">>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <button type="button">Outside</button>
      <Dialog
        label="Delete project?"
        description="The project and its files are removed."
        open={open}
        onOpenChange={setOpen}
        onCancel={onCancel}
        onClose={onClose}
        actions={
          <>
            <Button variant="secondary" onActivate={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onActivate={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
        {...props}
      />
    </>
  );
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const part = (name: string) => document.querySelector<HTMLElement>(`.ds-dialog__${name}`)!;
const root = () => document.querySelector<HTMLElement>(".ds-dialog")!;
const button = (name: string) => page.getByRole("button", { name, exact: true });

async function openByClick() {
  await userEvent.click(button("Open"));
  await expect.poll(dialog).not.toBeNull();
}

async function openByKeyboard() {
  button("Open").element().focus();
  await userEvent.keyboard("{Enter}");
  await expect.poll(dialog).not.toBeNull();
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

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
const token = (name: string) => asColor(resolve(name));

afterEach(() => {
  document.documentElement.dataset.theme = "light";
});

describe("component.dialog#visible-title (MUST)", () => {
  test("the visible title names the dialog", async () => {
    await render(<Example />);
    await openByClick();
    await expect.element(page.getByRole("dialog", { name: "Delete project?" })).toBeVisible();
    expect(part("title").textContent).toBe("Delete project?");
    expect(part("title").getBoundingClientRect().height).toBeGreaterThan(0);
  });

  test("warns when the label is empty", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await render(<Dialog label=" " defaultOpen />);
    expect(warn.mock.calls.flat().join("\n")).toMatch(/Dialog: label is empty/);
    warn.mockRestore();
  });
});

describe("component.dialog#explicit-exit (MUST)", () => {
  test("the Cancel action closes the dialog when dismissal is disabled", async () => {
    await render(<Example dismissible={false} />);
    await openByKeyboard();
    await userEvent.keyboard("{Escape}");
    expect(dialog()).not.toBeNull();
    await userEvent.click(button("Cancel"));
    await expect.poll(dialog).toBeNull();
  });

  test("an uncontrolled dialog's actions close it through the close function", async () => {
    const onOpenChange = vi.fn();
    await render(
      <Dialog
        label="Rename"
        defaultOpen
        onOpenChange={onOpenChange}
        actions={(close) => <Button onActivate={close}>Done</Button>}
      />,
    );
    await userEvent.click(button("Done"));
    await expect.poll(dialog).toBeNull();
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });
});

describe("component.dialog#modal-background (MUST)", () => {
  test("the surrounding view cannot be clicked or focused while open", async () => {
    const outside = vi.fn();
    await render(
      <>
        <button type="button" onClick={outside}>
          Behind
        </button>
        <Dialog label="Rename" defaultOpen actions={<Button>Done</Button>} />
      </>,
    );
    const behind = page.getByRole("button", { name: "Behind", includeHidden: true }).element();
    expect(behind.closest("[inert]")).not.toBeNull();
    const rect = behind.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + 2, rect.top + 2);
    expect(hit?.closest(".ds-dialog")).not.toBeNull();
    behind.focus();
    expect(document.activeElement).not.toBe(behind);
    await userEvent.click(behind, { force: true });
    expect(outside).not.toHaveBeenCalled();
  });
});

describe("component.dialog#cancellation (MUST)", () => {
  test("Escape reports cancel and closes when dismissible", async () => {
    const onCancel = vi.fn();
    await render(<Example onCancel={onCancel} />);
    await openByKeyboard();
    await userEvent.keyboard("{Escape}");
    await expect.poll(dialog).toBeNull();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onCancel.mock.calls[0][0]).toBeInstanceOf(Event);
    expect(onCancel.mock.calls[0][0].cancelable).toBe(true);
  });

  test("preventing cancel keeps the dialog open", async () => {
    const onClose = vi.fn();
    await render(<Example onCancel={(event) => event.preventDefault()} onClose={onClose} />);
    await openByKeyboard();
    await userEvent.keyboard("{Escape}");
    await nextFrame();
    expect(dialog()).not.toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  test("Escape does nothing when not dismissible", async () => {
    const onCancel = vi.fn();
    await render(<Example dismissible={false} onCancel={onCancel} />);
    await openByKeyboard();
    await userEvent.keyboard("{Escape}");
    await nextFrame();
    expect(dialog()).not.toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
    expect(root().dataset.dismissible).toBe("false");
  });

  test("a control that consumes Escape keeps the dialog open", async () => {
    const onCancel = vi.fn();
    await render(
      <Dialog label="Search" defaultOpen onCancel={onCancel}>
        <input
          aria-label="Query"
          onKeyDown={(event) => {
            if (event.key === "Escape") event.stopPropagation();
          }}
        />
      </Dialog>,
    );
    page.getByRole("textbox", { name: "Query" }).element().focus();
    await userEvent.keyboard("{Escape}");
    await nextFrame();
    expect(dialog()).not.toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("Escape during text composition does not request dismissal", async () => {
    const onCancel = vi.fn();
    await render(
      <Dialog label="Search" defaultOpen onCancel={onCancel}>
        <input aria-label="Query" />
      </Dialog>,
    );
    const input = page.getByRole("textbox", { name: "Query" }).element();
    input.focus();
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", isComposing: true, bubbles: true }),
    );
    await nextFrame();
    expect(dialog()).not.toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("clicking the backdrop never closes the dialog", async () => {
    const onCancel = vi.fn();
    await render(<Example onCancel={onCancel} />);
    await openByClick();
    await userEvent.click(root(), { position: { x: 4, y: 4 } });
    await nextFrame();
    expect(dialog()).not.toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("Escape dismisses only the active dialog", async () => {
    const outerCancel = vi.fn();
    function Stacked() {
      const [inner, setInner] = useState(false);
      return (
        <Dialog label="Outer" defaultOpen onCancel={outerCancel}>
          <button type="button" onClick={() => setInner(true)}>
            More
          </button>
          <Dialog label="Inner" open={inner} onOpenChange={setInner} />
        </Dialog>
      );
    }
    await render(<Stacked />);
    await userEvent.click(button("More"));
    await expect.poll(() => document.querySelectorAll('[role="dialog"]').length).toBe(2);
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => document.querySelectorAll('[role="dialog"]').length).toBe(1);
    expect(page.getByRole("dialog", { name: "Outer" }).element()).toBeTruthy();
    expect(outerCancel).not.toHaveBeenCalled();
  });
});

describe("component.dialog#close-notification (MUST)", () => {
  test("reports close once for Escape, an action, and a programmatic change", async () => {
    const onClose = vi.fn();
    await render(<Example onClose={onClose} />);
    await openByKeyboard();
    await userEvent.keyboard("{Escape}");
    await expect.poll(dialog).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);

    await openByKeyboard();
    await userEvent.click(button("Delete"));
    await expect.poll(dialog).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  test("a parent closing the dialog reports close once; closing it again does nothing", async () => {
    const onClose = vi.fn();
    const screen = await render(<Dialog label="Rename" open onClose={onClose} />);
    await screen.rerender(<Dialog label="Rename" open={false} onClose={onClose} />);
    expect(onClose).toHaveBeenCalledOnce();
    await screen.rerender(<Dialog label="Rename" open={false} onClose={onClose} />);
    expect(onClose).toHaveBeenCalledOnce();
  });

  test("a dialog that was never open reports nothing", async () => {
    const onClose = vi.fn();
    const screen = await render(<Dialog label="Rename" open={false} onClose={onClose} />);
    await screen.rerender(<Dialog label="Rename" open={false} onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("component.dialog#content-scroll (MUST)", () => {
  test("the dialog stays in the viewport, content scrolls, and the page does not", async () => {
    await render(
      <>
        <div style={{ blockSize: "3000px" }}>Tall page</div>
        <Dialog label="Terms" defaultOpen actions={<Button>Accept</Button>}>
          <div style={{ blockSize: "2000px" }}>Long terms</div>
        </Dialog>
      </>,
    );
    await expect.poll(dialog).not.toBeNull();
    const box = part("dialog").getBoundingClientRect();
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.bottom).toBeLessThanOrEqual(innerHeight);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(innerWidth);

    const content = part("content");
    expect(getComputedStyle(content).overflowY).toBe("auto");
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    content.scrollTop = 500;
    expect(content.scrollTop).toBe(500);
    // The actions stay in view below the scrolling content.
    expect(part("actions").getBoundingClientRect().bottom).toBeLessThanOrEqual(innerHeight);

    expect(getComputedStyle(document.documentElement).overflow).toBe("hidden");
  });
});

describe("component.dialog#initial-focus (MUST)", () => {
  test("the title takes focus on opening", async () => {
    await render(<Example />);
    await openByKeyboard();
    await expect.poll(() => document.activeElement).toBe(part("title"));
  });

  test("a consumer can designate the control to focus", async () => {
    function Designated() {
      const name = useRef<HTMLInputElement>(null);
      return (
        <Dialog label="Rename" defaultOpen initialFocus={name}>
          <input ref={name} aria-label="Name" />
        </Dialog>
      );
    }
    await render(<Designated />);
    await expect
      .poll(() => document.activeElement)
      .toBe(page.getByRole("textbox", { name: "Name" }).element());
  });
});

describe("component.dialog#contain-focus (MUST)", () => {
  test("Tab and Shift+Tab stay within the dialog", async () => {
    await render(<Example />);
    await openByKeyboard();
    await expect.poll(() => document.activeElement).toBe(part("title"));
    await userEvent.tab();
    expect(document.activeElement).toBe(button("Cancel").element());
    await userEvent.tab();
    expect(document.activeElement).toBe(button("Delete").element());
    await userEvent.tab();
    expect(document.activeElement).toBe(button("Cancel").element());
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(button("Delete").element());
  });
});

describe("component.dialog#restore-focus (MUST)", () => {
  test("focus returns to the element that opened the dialog", async () => {
    await render(<Example />);
    await openByKeyboard();
    await userEvent.keyboard("{Escape}");
    await expect.poll(dialog).toBeNull();
    await expect.poll(() => document.activeElement).toBe(button("Open").element());
  });

  test("when that element is gone, the consumer's choice in onClose holds", async () => {
    function Removing() {
      const [open, setOpen] = useState(false);
      const [trigger, setTrigger] = useState(true);
      const next = useRef<HTMLButtonElement>(null);
      return (
        <>
          {trigger ? (
            <button type="button" onClick={() => setOpen(true)}>
              Open
            </button>
          ) : null}
          <button type="button" ref={next}>
            Next step
          </button>
          <Dialog
            label="Delete project?"
            open={open}
            onOpenChange={setOpen}
            onClose={() => next.current?.focus()}
            actions={
              <Button
                variant="destructive"
                onActivate={() => {
                  setTrigger(false);
                  setOpen(false);
                }}
              >
                Delete
              </Button>
            }
          />
        </>
      );
    }
    await render(<Removing />);
    await openByKeyboard();
    await userEvent.click(button("Delete"));
    await expect.poll(dialog).toBeNull();
    await nextFrame();
    await nextFrame();
    expect(document.activeElement).toBe(button("Next step").element());
  });
});

describe("component.dialog#accessible-modal (MUST)", () => {
  test("exposes dialog role, modal state, title, and description", async () => {
    await render(<Example />);
    await openByClick();
    const el = page.getByRole("dialog", { name: "Delete project?" }).element();
    expect(el.getAttribute("aria-modal")).toBe("true");
    expect(el.getAttribute("aria-labelledby")).toBe(part("title").id);
    const described = document.getElementById(el.getAttribute("aria-describedby")!);
    expect(described?.textContent).toBe("The project and its files are removed.");
  });

  test("leaves out the description reference when there is none", async () => {
    await render(<Dialog label="Rename" defaultOpen />);
    expect(dialog()?.hasAttribute("aria-describedby")).toBe(false);
    expect(document.querySelector(".ds-dialog__description")).toBeNull();
  });
});

describe("component.dialog#visible-focus (MUST)", () => {
  test("the title shows the focus ring when it takes focus, even after a pointer click", async () => {
    await render(<Example />);
    await openByClick();
    await expect.poll(() => document.activeElement).toBe(part("title"));
    const ring = getComputedStyle(part("title"));
    expect(ring.outlineStyle).toBe("solid");
    expect(parseFloat(ring.outlineWidth)).toBeGreaterThan(0);
    expect(ring.outlineColor).toBe(token("--ds-semantic-color-border-focus"));
  });
});

describe("guideline.accessibility#forced-colors (MUST)", () => {
  afterEach(async () => {
    await cdp().send("Emulation.setEmulatedMedia", { features: [] });
  });

  test("the boundary and focus ring stay visible under forced colors", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    expect(matchMedia("(forced-colors: active)").matches).toBe(true);
    await render(<Example />);
    await openByKeyboard();
    await expect.poll(() => document.activeElement).toBe(part("title"));
    const surface = getComputedStyle(part("dialog"));
    expect(surface.borderTopStyle).toBe("solid");
    expect(parseFloat(surface.borderTopWidth)).toBeGreaterThan(0);
    expect(surface.borderTopColor).toBe(asColor("CanvasText"));
    const ring = getComputedStyle(part("title"));
    expect(ring.outlineStyle).toBe("solid");
    expect(ring.outlineColor).toBe(asColor("Highlight"));
  });
});

describe("tokens", () => {
  test("backdrop, dialog, title, description, and actions use their bindings", async () => {
    await render(<Example />);
    await openByClick();
    expect(getComputedStyle(root()).backgroundColor).toBe(
      token("--ds-semantic-color-background-overlay"),
    );

    const surface = getComputedStyle(part("dialog"));
    expect(surface.backgroundColor).toBe(token("--ds-semantic-color-background-surface"));
    expect(surface.color).toBe(token("--ds-semantic-color-foreground-default"));
    expect(surface.borderTopColor).toBe(token("--ds-semantic-color-border-default"));
    expect(surface.borderTopLeftRadius).toBe(resolve("--ds-semantic-radius-surface"));
    expect(surface.boxShadow).not.toBe("none");
    expect(surface.paddingTop).toBe(resolve("--ds-primitives-space-6"));
    expect(surface.paddingInlineStart).toBe(resolve("--ds-primitives-space-6"));
    expect(surface.rowGap).toBe(resolve("--ds-primitives-space-4"));

    const title = getComputedStyle(part("title"));
    expect(title.color).toBe(token("--ds-semantic-color-foreground-default"));
    expect(title.fontSize).toBe(resolve("--ds-semantic-typography-title-font-size"));
    expect(title.fontWeight).toBe(resolve("--ds-semantic-typography-title-font-weight"));

    const description = getComputedStyle(part("description"));
    expect(description.color).toBe(token("--ds-semantic-color-foreground-muted"));
    expect(description.fontSize).toBe(resolve("--ds-semantic-typography-body-md-font-size"));

    expect(getComputedStyle(part("actions")).columnGap).toBe(resolve("--ds-primitives-space-2"));
  });

  test("the dark theme uses the darker overlay and dark surface", async () => {
    document.documentElement.dataset.theme = "dark";
    await render(<Dialog label="Rename" defaultOpen />);
    expect(getComputedStyle(root()).backgroundColor).toBe(
      token("--ds-semantic-color-background-overlay"),
    );
    expect(getComputedStyle(root()).backgroundColor).toBe("rgba(23, 23, 23, 0.75)");
    expect(getComputedStyle(part("dialog")).backgroundColor).toBe(
      token("--ds-semantic-color-background-surface"),
    );
  });
});
