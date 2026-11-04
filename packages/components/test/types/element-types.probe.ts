/**
 * Proves the published element types are real: each `@ts-expect-error` line must fail to compile,
 * or TypeScript reports the directive as unused. `test/element-types.test.ts` compiles this file.
 */
import type { ElementAttributes } from "@taproot-ds/web-components";

export const button: ElementAttributes["ds-button"] = {
  variant: "secondary",
  size: "small",
  type: "submit",
  "full-width": true,
  disabled: true,
};

export const checkbox: ElementAttributes["ds-checkbox"] = {
  label: "Terms",
  checked: true,
  indeterminate: false,
  name: "terms",
  value: "yes",
};

// @ts-expect-error "loud" is not a Button variant.
export const unknownVariant: ElementAttributes["ds-button"] = { variant: "loud" };

// @ts-expect-error Button's action maps to type, not action.
export const specName: ElementAttributes["ds-button"] = { action: "submit" };

// @ts-expect-error checked is a boolean.
export const wrongKind: ElementAttributes["ds-checkbox"] = { checked: "yes" };

export function narrow(element: HTMLElementTagNameMap["ds-link"]) {
  element.variant = "standalone";
  // @ts-expect-error "block" is not a Link variant.
  element.variant = "block";
}
