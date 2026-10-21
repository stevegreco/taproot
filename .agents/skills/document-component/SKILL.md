---
name: document-component
description: Write the docs example and Verify steps for an implemented component of the Ember & Sage design system, in apps/documentation. Use when asked to document a component, add or fix its live example or Verify steps, add preview prose, or review a docs PR. The last of three phases, after spec-component and implement-component.
---

# Document a component

The last of three phases, one commit each in a single pull request:

1. **spec-component**: a draft spec that says what the component is for.
2. **implement-component**: completes the spec and builds the web component.
3. **document-component** (this skill): the docs example and its Verify steps.

Start on the component's branch, after its implementation commit is reviewed: its spec is not a
draft and `apps/documentation/implementation/<name>.md` exists. The component already has a docs
page built from the spec and that file. This phase adds a realistic example and steps that prove
it works.

```bash
pnpm spec get component.<name> --impl web
```

Read the spec's usage and rules first. The example shows the component used the way the spec
says, and the Verify steps prove what a person would check.

## 1. Write the example

```bash
pnpm component:new <name> --phase docs
```

This writes the example with its exact Verify header and a `data-<name>-subject` handle, and a
`.verify.js` file with one placeholder step that fails until you write it.

`apps/documentation/examples/<name>.tsx`: one realistic demo, not a gallery of variants (Storybook
covers those).

- The header is exactly:

  ```tsx
  /**
   * Verify: run the steps in `<name>.verify.js`. The docs tests run them against the built site.
   */
  ```

  The docs test fails without it.

- Mark stable handles with `data-<name>-*` attributes and query those, not text positions or
  classes.
- `examples/custom-elements.d.ts` maps element attributes onto JSX once. Check whether the
  component needs an entry there.

## 2. Write the Verify steps

`apps/documentation/examples/<name>.verify.js` is plain JS:

```js
export default async function verify({ page, step, eventually, exposedNodes }) {
  await step("what this step proves", async () => {
    // act the way a person would, then check
  });
}
```

- Name each step for what it proves. Drive the demo the way a person would: click, type, press
  keys.
- Use `eventually(read, expected, what)` for anything React updates after an action.
- Playwright CSS locators pierce open shadow roots: `page.locator("ds-checkbox input")`.
- For roles and names set through `ElementInternals`, poll `exposedNodes()` with `eventually`. It
  reads the right frame and throws if the example is not in the tree. Do not open your own CDP
  session.
- The runner waits for hydration before your steps. Do not add sleeps.

## 3. Preview prose (optional)

`apps/documentation/docs/components/<name>.mdx` holds preview prose only. Do not restate the spec;
the page renders usage, rules, anatomy, API, and tokens from it.

## 4. Check

```bash
pnpm component:status <name> --phase docs
pnpm exec turbo run test --filter=documentation
```

The docs tests build the site first, so they take longer than the others. Then run
`pnpm lint` and `pnpm format:check`.

## Pull request

Commit on the same branch and add a "Docs" section to the pull request description that lists what
each Verify step proves. The pull request merges after this commit is reviewed.

Fixing or documenting a component that is already on `main` is a pull request of its own.
