import type { DsBadge } from "@stevegreco/design-system-components/badge";
import type { DsButton } from "@stevegreco/design-system-components/button";
import type { DsTextField } from "@stevegreco/design-system-components/text-field";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type DsButtonAttributes = DetailedHTMLProps<HTMLAttributes<DsButton>, DsButton> & {
  disabled?: boolean;
  "full-width"?: boolean;
  size?: "sm" | "md";
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

type DsBadgeAttributes = DetailedHTMLProps<HTMLAttributes<DsBadge>, DsBadge> & {
  variant?: "default" | "accent" | "success" | "danger" | "warning" | "info";
};

type DsTextFieldAttributes = DetailedHTMLProps<HTMLAttributes<DsTextField>, DsTextField> & {
  autocomplete?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  label?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "password" | "search" | "url" | "tel";
  value?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ds-badge": DsBadgeAttributes;
      "ds-button": DsButtonAttributes;
      "ds-text-field": DsTextFieldAttributes;
    }
  }
}
