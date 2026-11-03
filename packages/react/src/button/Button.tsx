import { useCallback, useEffect, useRef, type ReactNode, type Ref } from "react";
import { Button as AriaButton } from "react-aria-components";
import "./button.css";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";
export type ButtonSize = "small" | "medium";
export type ButtonAction = "activate" | "submit" | "reset";

export interface ButtonProps {
  /** Emphasis and risk. Default `primary`. */
  variant?: ButtonVariant;
  /** Default `medium`. */
  size?: ButtonSize;
  /**
   * What the button does in a form. `activate` (default) neither submits nor resets; `submit`
   * submits the button's form; `reset` restores that form's initial values.
   */
  action?: ButtonAction;
  /** Prevents activation. */
  disabled?: boolean;
  /** Fills the available inline size. */
  fullWidth?: boolean;
  /** Accessible name when the visible content is not enough, such as an icon-only button. */
  accessibleName?: string;
  /**
   * Called when a person activates the button by pointer, Enter, or Space. Never called while
   * disabled. Called for every action, before a submit or reset.
   */
  onActivate?: () => void;
  /** The label, with an optional decorative icon. */
  children?: ReactNode;
  /** Added to the control's classes. */
  className?: string;
  /** The native button element. */
  ref?: Ref<HTMLButtonElement>;
}

const actionType = { activate: "button", submit: "submit", reset: "reset" } as const;

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export function Button({
  variant = "primary",
  size = "medium",
  action = "activate",
  disabled = false,
  fullWidth = false,
  accessibleName,
  onActivate,
  children,
  className,
  ref,
}: ButtonProps) {
  const own = useRef<HTMLButtonElement | null>(null);
  const mergedRef = useCallback(
    (node: HTMLButtonElement | null) => {
      own.current = node;
      setRef(ref, node);
    },
    [ref],
  );

  // icon-accessible-name: a button with no visible text needs accessibleName.
  useEffect(() => {
    const el = own.current;
    if (!el) return;
    if (!accessibleName?.trim() && !el.textContent?.trim()) {
      console.warn(
        "Button: the button has no visible text and no accessibleName. Give an icon-only button an accessibleName.",
      );
    }
  }, [accessibleName, children]);

  return (
    <AriaButton
      ref={mergedRef}
      type={actionType[action]}
      isDisabled={disabled}
      aria-label={accessibleName?.trim() ? accessibleName : undefined}
      onPress={onActivate ? () => onActivate() : undefined}
      className={className ? `ds-button ${className}` : "ds-button"}
      data-variant={variant}
      data-size={size}
      data-full-width={fullWidth || undefined}
    >
      <span className="ds-button__content">{children}</span>
    </AriaButton>
  );
}
