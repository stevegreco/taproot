import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  SwitchButton as AriaSwitchButton,
  SwitchField as AriaSwitchField,
  Text,
} from "react-aria-components";
import "./switch.css";

export interface SwitchProps {
  /** Visible setting name. It is the accessible name and stays the same when on and off. */
  label: string;
  /** Supporting guidance, such as the consequence of turning the setting on. */
  hint?: string;
  /** Failure text. A non-empty error marks the setting invalid and blocks its form from submitting. */
  error?: string;
  /** Whether the setting is on (controlled). Pair with `onChange`. */
  checked?: boolean;
  /** Whether the setting starts on (uncontrolled). Form reset restores it. */
  defaultChecked?: boolean;
  /** Prevents interaction and removes the switch from keyboard navigation and form data. */
  disabled?: boolean;
  /** Form field name. The value is recorded under this name only when the switch is on. */
  name?: string;
  /** Value recorded under `name` when on. Defaults to `"on"`. */
  value?: string;
  /** Called first when the person toggles the switch, with the new state. */
  onInput?: (checked: boolean) => void;
  /**
   * Called after `onInput` when the person toggles the switch, with the new state. Apply the
   * setting here. Not called for programmatic changes or form reset.
   */
  onChange?: (checked: boolean) => void;
  className?: string;
}

/**
 * A form reset makes React Aria set the initial state through its change handler. The spec treats
 * that as a programmatic change, so mark the reset (a capture listener on the form runs before
 * React Aria's own listener) and report nothing for it.
 */
function useResetFlag(inputRef: React.RefObject<HTMLInputElement | null>) {
  const resetting = useRef(false);
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => {
      resetting.current = true;
      queueMicrotask(() => {
        resetting.current = false;
      });
    };
    form.addEventListener("reset", onReset, { capture: true });
    return () => form.removeEventListener("reset", onReset, { capture: true });
  });
  return resetting;
}

export function Switch({
  label,
  hint,
  error,
  checked,
  defaultChecked = false,
  disabled = false,
  name,
  value,
  onInput,
  onChange,
  className,
}: SwitchProps) {
  useEffect(() => {
    if (!label.trim()) {
      console.warn("Switch: label is empty. A switch needs a visible setting name.");
    }
  }, [label]);

  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const isSelected = isControlled ? checked : internal;

  const inputRef = useRef<HTMLInputElement>(null);
  const resetting = useResetFlag(inputRef);

  // React Aria stays controlled: it reports every change here and the wrapper decides which ones
  // are the person's. Reset restores the uncontrolled default without reporting anything.
  const handleChange = useCallback(
    (next: boolean) => {
      if (resetting.current) {
        if (!isControlled) setInternal(defaultChecked);
        return;
      }
      if (!isControlled) setInternal(next);
      onInput?.(next);
      onChange?.(next);
    },
    [resetting, isControlled, defaultChecked, onInput, onChange],
  );

  const isInvalid = Boolean(error);

  // A non-empty error blocks submit, and the browser shows the error text, not a generic message.
  useLayoutEffect(() => {
    inputRef.current?.setCustomValidity(error ?? "");
  }, [error]);

  return (
    <AriaSwitchField
      className={className ? `ds-switch ${className}` : "ds-switch"}
      isSelected={isSelected}
      defaultSelected={defaultChecked}
      onChange={handleChange}
      isDisabled={disabled}
      isInvalid={isInvalid}
      validationBehavior="aria"
      name={name}
      value={value}
      inputRef={inputRef}
    >
      <AriaSwitchButton className="ds-switch__choice">
        <span className="ds-switch__control" aria-hidden="true">
          <span className="ds-switch__indicator" />
        </span>
        <span className="ds-switch__label">{label}</span>
      </AriaSwitchButton>
      {hint ? (
        <Text slot="description" className="ds-switch__hint">
          {hint}
        </Text>
      ) : null}
      {isInvalid ? (
        <Text slot="errorMessage" className="ds-switch__error">
          {error}
        </Text>
      ) : null}
    </AriaSwitchField>
  );
}
