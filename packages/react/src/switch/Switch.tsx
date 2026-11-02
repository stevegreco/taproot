import { useCallback, useEffect, useRef } from "react";
import {
  SwitchButton as AriaSwitchButton,
  SwitchField as AriaSwitchField,
  Text,
} from "react-aria-components";
import {
  useControllableState,
  useFormReset,
  useNativeInput,
  validationBehavior,
} from "../internal/form-field";
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

  const [isSelected, setInternal, isControlled] = useControllableState(checked, defaultChecked);

  const inputRef = useRef<HTMLInputElement>(null);
  const resetting = useFormReset(inputRef, () => setInternal(defaultChecked));
  useNativeInput(inputRef, { checked: isSelected, error });

  const handleChange = useCallback(
    (next: boolean) => {
      if (resetting.current) return;
      if (!isControlled) setInternal(next);
      onInput?.(next);
      onChange?.(next);
    },
    [resetting, isControlled, setInternal, onInput, onChange],
  );

  const isInvalid = Boolean(error);

  return (
    <AriaSwitchField
      className={className ? `ds-switch ${className}` : "ds-switch"}
      isSelected={isSelected}
      onChange={handleChange}
      isDisabled={disabled}
      isInvalid={isInvalid}
      validationBehavior={validationBehavior}
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
