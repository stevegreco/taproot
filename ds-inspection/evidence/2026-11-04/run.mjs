import { chromium } from "playwright";
import http from "http";
import fs from "fs";
import path from "path";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const srv = http
  .createServer((q, r) => {
    const f = path.join("out", q.url.split("?")[0]);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) {
      r.writeHead(200, { "content-type": types[path.extname(f)] });
      r.end(fs.readFileSync(f));
    } else {
      r.writeHead(404);
      r.end();
    }
  })
  .listen(0);
const base = `http://localhost:${srv.address().port}/`;
const axe = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const b = await chromium.launch();
const out = {};
for (const page of ["settings", "all"])
  for (const theme of ["light", "dark"]) {
    const c = await b.newContext({ viewport: { width: 900, height: 1000 } });
    const p = await c.newPage();
    const errs = [];
    p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    p.on("pageerror", (e) => errs.push(String(e)));
    await p.goto(base + page + ".html");
    await p.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
    await p.waitForTimeout(300);
    await p.addScriptTag({ content: axe });
    const r = await p.evaluate(async () => {
      const r = await axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
        },
      });
      return {
        v: r.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          n: v.nodes.length,
          t: v.nodes
            .slice(0, 4)
            .map((n) => [
              JSON.stringify(n.target),
              (n.any[0]?.message || n.failureSummary || "").slice(0, 130),
            ]),
        })),
        inc: r.incomplete.map((v) => v.id + ":" + v.nodes.length),
        pass: r.passes.length,
      };
    });
    out[page + "/" + theme] = { errs, ...r };
    await p.screenshot({ path: `out/${page}-${theme}.png`, fullPage: true });
    if (page === "all" && theme === "light") {
      out.targets = await p.evaluate(() => {
        const res = [];
        const walk = (root) => {
          for (const e of root.querySelectorAll("*")) {
            if (e.shadowRoot) walk(e.shadowRoot);
            if (e.matches("button,a[href],input:not([type=hidden]),select,textarea,summary")) {
              const h = e.getRootNode().host;
              const r = e.getBoundingClientRect();
              let lab = e.labels?.[0]?.getBoundingClientRect();
              res.push([
                (h?.localName || e.localName) + ">" + e.localName,
                Math.round(r.width),
                Math.round(r.height),
                lab ? Math.round(lab.width) + "x" + Math.round(lab.height) : "",
              ]);
            }
          }
        };
        walk(document);
        return res.filter((x) => x[1] < 24 || x[2] < 24);
      });
    }
    await c.close();
  }
// keyboard + dialog on settings
{
  const c = await b.newContext();
  const p = await c.newPage();
  await p.goto(base + "settings.html");
  await p.waitForTimeout(200);
  const seq = [];
  const active = () =>
    p.evaluate(() => {
      let a = document.activeElement;
      while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
      const h = a.getRootNode().host;
      return (
        (h?.localName || "") +
        ">" +
        a.localName +
        ":" +
        (a.labels?.[0]?.textContent.trim().slice(0, 20) || a.textContent?.trim().slice(0, 20))
      );
    });
  for (let i = 0; i < 9; i++) {
    await p.keyboard.press("Tab");
    seq.push(await active());
  }
  out.tab = seq;
  await p.locator("#delete").focus();
  await p.keyboard.press("Enter");
  await p.waitForTimeout(100);
  out.dialogOpen = await p.evaluate(() => document.querySelector("ds-dialog").open);
  out.dialogFocus = await active();
  const tr = [];
  for (let i = 0; i < 4; i++) {
    await p.keyboard.press("Tab");
    tr.push(await active());
  }
  out.trap = tr;
  await p.keyboard.press("Escape");
  await p.waitForTimeout(100);
  out.afterEsc = [await p.evaluate(() => document.querySelector("ds-dialog").open), await active()];
  const fd = await p.evaluate(() => {
    const f = document.querySelector("form");
    f.querySelector("[name=name]").value = "Ada";
    f.querySelector("[name=email]").value = "a@b.co";
    return [f.checkValidity(), Object.fromEntries(new FormData(f))];
  });
  out.form = fd;
  await c.close();
}
// forced colors
{
  const c = await b.newContext({ forcedColors: "active", viewport: { width: 900, height: 1000 } });
  const p = await c.newPage();
  await p.goto(base + "all.html");
  await p.waitForTimeout(300);
  await p.screenshot({ path: "out/all-forced.png", fullPage: true });
  out.forced = await p.evaluate(() =>
    ["ds-button", "ds-badge", "ds-text-field", "ds-link"].map((t) => {
      const e = document.querySelector(t);
      const n = e.shadowRoot.querySelector("button,span,input,a,div");
      const s = getComputedStyle(n);
      return [
        t,
        n.localName,
        s.borderTopWidth,
        s.borderTopStyle,
        s.borderTopColor,
        s.backgroundColor,
        s.color,
      ];
    }),
  );
  await c.close();
}
await b.close();
srv.close();
console.log(JSON.stringify(out, null, 1));
