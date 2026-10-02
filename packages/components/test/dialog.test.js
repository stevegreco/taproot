import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { defineDialog } from "../src/dialog.js";
import { defineButton } from "../src/button.js";
const tag = "test-ds-dialog";
beforeAll(() => {
  defineDialog(tag);
  defineButton("test-dialog-button");
});
afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty("overflow");
});
function render() {
  document.body.innerHTML = `<button id="trigger">Open</button><${tag} label="Delete project" description="This cannot be undone."><p>Project details</p><button slot="actions">Cancel</button><button slot="actions">Delete</button></${tag}>`;
  const dialog = document.querySelector(tag);
  const trigger = document.querySelector("#trigger");
  trigger.focus();
  return {
    dialog,
    trigger,
    inner: dialog.shadowRoot.querySelector("dialog"),
    title: dialog.shadowRoot.querySelector("h2"),
    buttons: dialog.querySelectorAll("button"),
  };
}
describe("DsDialog", () => {
  test("[accessible-modal] title and description name the modal surface", () => {
    const { dialog, inner, title } = render();
    dialog.showModal();
    expect(inner.matches(":modal")).toBe(true);
    expect(inner.getAttribute("aria-labelledby")).toBe(title.id);
    expect(title.textContent).toBe("Delete project");
    expect(inner.getAttribute("aria-describedby")).toBe("description");
    dialog.description = "";
    expect(inner.hasAttribute("aria-describedby")).toBe(false);
  });
  test("[initial-focus][restore-focus] opening focuses the title and closing restores the trigger", () => {
    const { dialog, trigger, title } = render();
    dialog.showModal();
    expect(dialog.shadowRoot.activeElement).toBe(title);
    dialog.close();
    expect(document.activeElement).toBe(trigger);
  });
  test("[initial-focus] a designated control receives initial focus", () => {
    const { dialog, buttons } = render();
    buttons[0].setAttribute("autofocus", "");
    dialog.showModal();
    expect(document.activeElement).toBe(buttons[0]);
  });
  test("[contain-focus] real Tab and Shift+Tab wrap within the dialog", async () => {
    const { dialog, buttons } = render();
    dialog.showModal();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(buttons[0]);
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(buttons[1]);
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(buttons[0]);
  });
  test("[contain-focus] composed controls inside open shadow roots wrap", async () => {
    const { dialog } = render();
    dialog.querySelectorAll("button").forEach((button) => button.remove());
    dialog.insertAdjacentHTML(
      "beforeend",
      '<test-dialog-button slot="actions">Cancel</test-dialog-button><test-dialog-button slot="actions">Confirm</test-dialog-button>',
    );
    const buttons = dialog.querySelectorAll("test-dialog-button");
    dialog.showModal();
    await userEvent.keyboard("{Tab}");
    expect(buttons[0].shadowRoot.activeElement?.tagName).toBe("BUTTON");
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(buttons[1].shadowRoot.activeElement?.tagName).toBe("BUTTON");
    await userEvent.keyboard("{Tab}");
    expect(buttons[0].shadowRoot.activeElement?.tagName).toBe("BUTTON");
  });
  test("[cancellation] a backdrop pointer action never dismisses", async () => {
    const { dialog, inner } = render();
    dialog.showModal();
    inner.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 0, clientY: 0 }));
    expect(dialog.open).toBe(true);
  });
  test("[restore-focus] removing the opener does not prevent closing", () => {
    const { dialog, trigger } = render();
    dialog.showModal();
    trigger.remove();
    expect(() => dialog.close()).not.toThrow();
    expect(document.documentElement.style.overflow).toBe("");
  });
  test("[contain-focus] no controls keeps focus on the title", async () => {
    const { dialog, title } = render();
    dialog.querySelectorAll("button").forEach((button) => button.remove());
    dialog.showModal();
    await userEvent.keyboard("{Tab}");
    expect(dialog.shadowRoot.activeElement).toBe(title);
  });
  test("[cancellation] Escape requests cancel and closes", async () => {
    const { dialog } = render();
    let cancels = 0;
    dialog.addEventListener("cancel", () => cancels++);
    dialog.showModal();
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => dialog.open).toBe(false);
    expect(cancels).toBe(1);
  });
  test("[cancellation] prevented cancel and dismissible false retain the dialog", async () => {
    const { dialog } = render();
    const prevent = (event) => event.preventDefault();
    dialog.addEventListener("cancel", prevent);
    dialog.showModal();
    await userEvent.keyboard("{Escape}");
    expect(dialog.open).toBe(true);
    dialog.removeEventListener("cancel", prevent);
    dialog.dismissible = false;
    let cancels = 0;
    dialog.addEventListener("cancel", () => cancels++);
    await userEvent.keyboard("{Escape}");
    expect(dialog.open).toBe(true);
    expect(cancels).toBe(0);
    dialog.close();
    expect(dialog.open).toBe(false);
  });
  test("[close-notification] close reports once even when reopened immediately", async () => {
    const { dialog } = render();
    let closes = 0;
    dialog.addEventListener("close", () => closes++);
    dialog.showModal();
    dialog.close();
    dialog.close();
    expect(closes).toBe(1);
    dialog.showModal();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(dialog.open).toBe(true);
    dialog.close();
    expect(closes).toBe(2);
  });
  test("[content-scroll] closing, hiding, and removal restore previous scroll style", () => {
    const { dialog } = render();
    document.documentElement.style.setProperty("overflow", "scroll", "important");
    dialog.showModal();
    expect(document.documentElement.style.overflow).toBe("hidden");
    dialog.hidden = true;
    expect(document.documentElement.style.overflow).toBe("scroll");
    expect(document.documentElement.style.getPropertyPriority("overflow")).toBe("important");
    dialog.hidden = false;
    expect(document.documentElement.style.overflow).toBe("hidden");
    dialog.remove();
    expect(document.documentElement.style.overflow).toBe("scroll");
  });
  test("[modal-background] surrounding controls cannot receive focus while open", () => {
    const { dialog, trigger, title } = render();
    dialog.showModal();
    trigger.focus();
    expect(dialog.shadowRoot.activeElement).toBe(title);
  });
});
