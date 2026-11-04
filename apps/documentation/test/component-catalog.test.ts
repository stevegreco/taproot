import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import { catalogBody, catalogRows, storybookHref, STORYBOOK_URL } from "../lib/component-catalog";

const rows = catalogRows();

test("the catalog lists each web component with its spec summary, sorted by title", () => {
  const button = rows.find((row) => row.slug === "button");
  assert.deepEqual(button, {
    slug: "button",
    title: "Button",
    summary: "Use Button to trigger an action or to submit or reset a form.",
    href: `${STORYBOOK_URL}/?path=/docs/components-button--docs`,
  });
  const titles = rows.map((row) => row.title);
  assert.deepEqual(
    titles,
    [...titles].sort((a, b) => a.localeCompare(b)),
  );
});

test("every catalog link matches the title of a story file", () => {
  for (const { slug, href } of rows) {
    const stories = readFileSync(
      new URL(`../../storybook/stories/${slug}.stories.js`, import.meta.url),
      "utf8",
    );
    const title = /title: "Components\/([^"]+)"/.exec(stories)?.[1];
    assert.ok(title, `${slug} stories have a Components title`);
    const id = title.toLowerCase().replaceAll(" ", "-");
    assert.equal(href, storybookHref(id), `${slug} links to its Storybook page`);
  }
});

test("the catalog page has one table row per component", () => {
  const body = catalogBody(rows);
  for (const { title, summary, href } of rows) {
    assert.ok(body.includes(`| [${title}](${href}) | ${summary} |`), `${title} row`);
  }
});
