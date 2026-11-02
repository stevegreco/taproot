import { useCallback, useRef, useState } from "react";
import {
  CheckboxButton as AriaCheckboxButton,
  CheckboxField as AriaCheckboxField,
  Text as AriaText,
} from "react-aria-components";
import {
  useControllableState,
  useFormReset,
  useNativeInput,
  validationBehavior,
} from "../internal/form-field";
import "./checkbox.css";

export interface CheckboxProps {
  /** Visible label. It is the accessible name and part of the click target. */
  label: string;
  /** Supporting guidance, shown under the label and read as the accessible description. */
  hint?: string;
  /**
   * What to fix. A non-empty value marks the checkbox invalid, shows the message, adds it to the
   * accessible description, and blocks the form from submitting.
   */
  error?: string;
  /** Whether the option is on (controlled). Pair with `onChange`. */
  checked?: boolean;
  /** Whether the option is on at first (uncontrolled). Form reset restores it. */
  defaultChecked?: boolean;
  /**
   * Shows the mixed state. Presentational only: it does not change `checked` or the submitted
   * value. A person activating the checkbox clears it; a new value from the parent sets it again.
   */
  indeterminate?: boolean;
  /** Form field name. The value submits under this name when checked. */
  name?: string;
  /** Value submitted when checked. Defaults to "on". */
  value?: string;
  /** Prevents toggling. A disabled checkbox submits nothing. */
  disabled?: boolean;
  /** The checkbox must be checked before its form submits. */
  required?: boolean;
  /** Called with the new checked state when a person toggles the checkbox, before `onChange`. */
  onInput?: (checked: boolean) => void;
  /** Called with the new checked state when a person toggles the checkbox. */
  onChange?: (checked: boolean) => void;
  className?: string;
}

function CheckMark() {
  return (
    <svg
      className="ds-checkbox__indicator"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Dash() {
  return (
    <svg
      className="ds-checkbox__indicator"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 8h8" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function Checkbox({
  label,
  hint,
  error,
  checked,
  defaultChecked,
  indeterminate = false,
  name,
  value,
  disabled = false,
  required = false,
  onInput,
  onChange,
  className,
}: CheckboxProps) {
  const [initialChecked] = useState(() => checked ?? defaultChecked ?? false);
  const [isChecked, setInternal, isControlled] = useControllableState(checked, initialChecked);

  // Indeterminate behaves like the DOM property: the parent sets it, a person's activation clears
  // it. A new prop value from the parent sets it again.
  const [mixed, setMixed] = useState(indeterminate);
  const [lastIndeterminate, setLastIndeterminate] = useState(indeterminate);
  if (indeterminate !== lastIndeterminate) {
    setLastIndeterminate(indeterminate);
    setMixed(indeterminate);
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const resetting = useFormReset(inputRef, () => {
    setMixed(false);
    setInternal(initialChecked);
  });
  useNativeInput(inputRef, { checked: isChecked, error, required });

  const handleChange = useCallback(
    (next: boolean) => {
      if (resetting.current) return;
      setMixed(false);
      if (!isControlled) setInternal(next);
      onInput?.(next);
      onChange?.(next);
    },
    [resetting, isControlled, setInternal, onInput, onChange],
  );

  const invalid = Boolean(error);
  const classes = ["ds-checkbox", className].filter(Boolean).join(" ");

  return (
    <AriaCheckboxField
      className={classes}
      isSelected={isChecked}
      onChange={handleChange}
      isIndeterminate={mixed}
      isDisabled={disabled}
      isRequired={required}
      isInvalid={invalid}
      validationBehavior={validationBehavior}
      name={name}
      value={value}
      inputRef={inputRef}
    >
      <AriaCheckboxButton className="ds-checkbox__choice">
        <span className="ds-checkbox__control">
          {mixed ? <Dash /> : isChecked ? <CheckMark /> : null}
        </span>
        <span className="ds-checkbox__label">
          {label}
          {required ? (
            <span className="ds-checkbox__required" aria-hidden="true">
              {" "}
              (required)
            </span>
          ) : null}
        </span>
      </AriaCheckboxButton>
      {hint ? (
        <AriaText slot="description" className="ds-checkbox__hint">
          {hint}
        </AriaText>
      ) : null}
      {invalid ? (
        <AriaText slot="errorMessage" className="ds-checkbox__error">
          {error}
        </AriaText>
      ) : null}
    </AriaCheckboxField>
  );
}
