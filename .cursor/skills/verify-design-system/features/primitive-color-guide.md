# Primitive color guide

The primitive color guide lets users browse fixed palette values, inspect contrast hints, and copy CSS variable names.

## Sub-features

- `color-palettes` renders every configured palette and step.
- `color-values` shows each CSS variable and hexadecimal value.
- `color-contrast` identifies the stronger black or white contrast.
- `color-copy` copies a token name and announces confirmation.

## How to get to it (user POV)

- Open `/design-tokens/primitives/color`.
- Browse sections within `[data-color-field-guide]`.
- Choose a button whose accessible name begins with `Copy primitives.color.`.

## Driving it with Playwright

Preconditions:

- Doctor passes for the run-owned documentation URL.
- Browser clipboard permission is granted for the run origin when clipboard contents are asserted.

- **Open guide.** Navigate to `/design-tokens/primitives/color`. Require `[data-color-field-guide]`, palette headings, and `[data-color-swatch]`.
- **Inspect token.** Choose the first `[data-color-copy]` button. Record its `data-color-copy` name and require the nearby token card to show a hexadecimal value and contrast ratio.
- **Copy token.** Select the button. Require its visible text to become `Copied` and the page's `role="status"` region to announce `<token name> copied`.
- **Confirm clipboard.** Read the browser clipboard and require the exact token name when permission is available.
- **Proof.** Capture the token card before selection and the confirmation state after selection, plus the chosen token name and clipboard result.

## Gotchas

- Clipboard access may be unavailable in an insecure preview; visible `Copied` feedback still occurs by design.
- Copy feedback resets after 1.7 seconds, so wait for the status text rather than sleeping.
- Primitive tokens describe raw values; this page explicitly directs product consumers toward semantic tokens.
- A rendered swatch alone does not prove its displayed variable, value, and contrast metadata agree.
