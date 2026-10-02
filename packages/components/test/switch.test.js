import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { userEvent, cdp } from "vitest/browser";
import { defineSwitch } from "../src/switch.js";
const tag = "test-switch";
beforeAll(() => defineSwitch(tag));
afterEach(async () => {
  document.body.replaceChildren();
  await cdp().send("Emulation.setEmulatedMedia", { features: [] });
});
function render(extra = "") {
  document.body.innerHTML = `<form><${tag} label="Notifications" name="notifications" ${extra}></${tag}></form>`;
  return document.querySelector(tag);
}
function control(host) {
  return host.shadowRoot.querySelector("input");
}
describe("DsSwitch", () => {
  test("exposes switch semantics with a stable visible label and associated messages", () => {
    const host = render('hint="Immediately" error="Try again"');
    const input = control(host);
    expect(input.getAttribute("role")).toBe("switch");
    expect(input.labels[0].textContent.trim()).toBe("Notifications");
    expect(input.getAttribute("aria-describedby")).toBe("hint error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    host.checked = true;
    expect(input.labels[0].textContent.trim()).toBe("Notifications");
  });
  test("label activation and Space emit input then change, script emits neither", async () => {
    const host = render();
    const events = [];
    for (const name of ["input", "change"]) host.addEventListener(name, () => events.push(name));
    await userEvent.click(host.shadowRoot.querySelector("label"));
    expect(host.checked).toBe(true);
    await userEvent.keyboard(" ");
    expect(host.checked).toBe(false);
    expect(events).toEqual(["input", "change", "input", "change"]);
    host.checked = true;
    expect(events).toHaveLength(4);
  });
  test("form association submits only when on, resets, and restores state", () => {
    const host = render("checked");
    expect(new FormData(host.form).get("notifications")).toBe("on");
    host.checked = false;
    expect(new FormData(host.form).has("notifications")).toBe(false);
    host.form.reset();
    expect(host.checked).toBe(true);
    host.formStateRestoreCallback("unchecked", "restore");
    expect(host.checked).toBe(false);
    host.disabled = true;
    expect(control(host).disabled).toBe(true);
  });
  test("input listener sees updated form state before change and preserves dirty checked state", async () => {
    const host = render("checked");
    const seen = [];
    host.addEventListener("input", () => {
      seen.push(new FormData(host.form).has("notifications"));
      host.removeAttribute("checked");
      host.setAttribute("checked", "");
    });
    await userEvent.click(control(host));
    expect(seen).toEqual([false]);
    expect(host.checked).toBe(false);
  });
  test("thumb follows RTL direction and remains visible in forced colors", async () => {
    await cdp().send("Emulation.setEmulatedMedia", {
      features: [{ name: "forced-colors", value: "active" }],
    });
    const host = render();
    host.dir = "rtl";
    const thumb = host.shadowRoot.querySelector(".indicator");
    const input = control(host);
    const off = thumb.getBoundingClientRect().left;
    host.checked = true;
    expect(thumb.getBoundingClientRect().left).toBeLessThan(off);
    expect(getComputedStyle(thumb).backgroundColor).not.toBe(
      getComputedStyle(input).backgroundColor,
    );
    await userEvent.tab();
    expect(getComputedStyle(input).outlineStyle).toBe("solid");
  });
});
