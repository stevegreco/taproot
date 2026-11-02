import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CheckboxButton as AriaCheckboxButton,
  CheckboxField as AriaCheckboxField,
  Text as AriaText,
} from "react-aria-components";
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
  const isControlled = checked !== undefined;
  const [initialChecked] = useState(() => checked ?? defaultChecked ?? false);
  const [internal, setInternal] = useState(initialChecked);
  const isChecked = isControlled ? checked : internal;

  // Indeterminate behaves like the DOM property: the parent sets it, a person's activation clears
  // it. A new prop value from the parent sets it again.
  const [mixed, setMixed] = useState(indeterminate);
  const [lastIndeterminate, setLastIndeterminate] = useState(indeterminate);
  if (indeterminate !== lastIndeterminate) {
    setLastIndeterminate(indeterminate);
    setMixed(indeterminate);
  }

  const inputRef = useRef<HTMLInputElement>(null);
  // React Aria restores its own initial value on form reset by calling onChange. Reset is not a
  // person's interaction, so those calls are ignored while a reset is in progress.
  const resetting = useRef(false);
  const [resetCount, setResetCount] = useState(0);

  const handleChange = useCallback(
    (next: boolean) => {
      if (resetting.current) return;
      setMixed(false);
      if (!isControlled) setInternal(next);
      onInput?.(next);
      onChange?.(next);
    },
    [isControlled, onInput, onChange],
  );

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onReset = () => {
      resetting.current = true;
      // The browser resets the controls after the reset event, so apply ours after that.
      timer = setTimeout(() => {
        resetting.current = false;
        setMixed(false);
        setInternal(initialChecked);
        setResetCount((n) => n + 1);
      }, 0);
    };
    // Capture runs before React Aria's own listener on the same form.
    form.addEventListener("reset", onReset, true);
    return () => {
      form.removeEventListener("reset", onReset, true);
      clearTimeout(timer);
    };
  }, [initialChecked]);

  // Keep the native input in step with the rendered state (a native reset can leave a controlled
  // input stale), and give it the constraints that block submit: required, and a non-empty error.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (input.checked !== isChecked) input.checked = isChecked;
    input.required = required;
    input.setCustomValidity(error ? error : "");
  }, [isChecked, required, error, resetCount]);

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
      validationBehavior="aria"
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
