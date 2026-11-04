import type { ElementAttributes } from "@taproot-ds/web-components";
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type CustomElements = {
  [Tag in keyof ElementAttributes]: ElementAttributes[Tag] &
    DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends CustomElements {}
  }
}
