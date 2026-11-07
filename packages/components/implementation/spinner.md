---
component: component.spinner
package: "@taproot-ds/web-components"
tagName: ds-spinner
defineExport: defineSpinner
usage: |
  <p>
    <ds-spinner label="Saving draft"></ds-spinner>
    Saving…
  </p>
  <ds-spinner size="large" label="Loading comments"></ds-spinner>
api:
  - { name: label, kind: attribute, parameter: accessibleName }
  - { name: size, kind: attribute, parameter: size }
---

## Slots

None. The spinner renders its own indicator and ignores children. Put visible status text, such as
"Saving…", beside it in your own markup.

The role (`progressbar`, with no value) and accessible name are set through `ElementInternals`, so
the host never gains `role` or `aria-*` attributes (`component.spinner#always-named`). An empty or
missing `label` reads as "Loading". Use `label`, not `aria-label`, to name the spinner. Button is
the one component that takes `aria-label`; the [Button implementation](button.md) says why.

## The hidden attribute

The spinner never sets `hidden` itself. Removing the element or setting `hidden` when the work ends
is the page's job, and neither is announced (`component.spinner#not-announced`).

## Framework notes

- Start rendering the spinner from a timer, not on the request itself, so short waits show nothing
  (`component.spinner#delay-short-waits`). Cancel the timer and remove the spinner when the work
  settles.
- To mark a whole region as busy for assistive technology, set `aria-busy="true"` on the region
  while the spinner shows. The spinner does not do this for you.
- Report the outcome with a `<ds-alert announce="polite">` once the spinner is gone.

## Styles

Install `@taproot-ds/tokens` alongside this package, and load its token stylesheet once at
the application root. Without it, the component has no colors, spacing, or type.

```js
import "@taproot-ds/tokens/css";
import "@taproot-ds/tokens/base"; // optional: page font, text color, background, and headings
```

Without a bundler, link the package's `dist/css/tokens.css` instead, and `dist/css/base.css` for
the optional page defaults. Components style only themselves; `guideline.page-setup` says what the
page around them needs.
