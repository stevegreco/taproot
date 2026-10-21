/**
 * JSX types for every design system element, built from the components package's
 * hand-written `ElementAttributes`. A new component adds its entry there, not here.
 */
import type { ElementAttributes } from "@stevegreco/design-system-components";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ElementFor<Tag> = Tag extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[Tag] : never;

type DesignSystemElements = {
  [Tag in keyof ElementAttributes]: DetailedHTMLProps<
    HTMLAttributes<ElementFor<Tag>>,
    ElementFor<Tag>
  > &
    ElementAttributes[Tag];
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends DesignSystemElements {}
  }
}
