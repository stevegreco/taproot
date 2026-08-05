import type { DsBadge } from "@stevegreco/design-system-components/badge";
import type { DsButton } from "@stevegreco/design-system-components/button";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type DsButtonAttributes = DetailedHTMLProps<
  HTMLAttributes<DsButton>,
  DsButton
> & {
  disabled?: boolean;
  "full-width"?: boolean;
  pill?: boolean;
  size?: "sm" | "md";
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ds-badge": DsBadgeAttributes;
      "ds-button": DsButtonAttributes;
    }
  }
}
type DsBadgeAttributes = DetailedHTMLProps<
  HTMLAttributes<DsBadge>,
  DsBadge
> & {
  variant?: "default" | "accent" | "success" | "danger" | "warning" | "info";
};
