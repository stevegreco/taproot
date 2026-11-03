/**
 * Select wraps the platform's native single-choice control. React Aria's Select draws its own
 * button, popover, and list box, and the spec rules out a custom overlay ("Use platform selection
 * behavior without a custom overlay"), so this is plain React around a native select.
 *
 * Of `internal/form-field.ts`, only `useControllableState` fits. `useNativeInput` keeps a
 * checkbox's `checked` in step and takes an input ref; `useFormReset` takes an input ref and exists
 * to ignore the change React Aria reports during a reset, which a native select never reports.
 * The reset and validity sync below do the same jobs for a select element.
 */
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useControllableState, useFormReset, useNativeInput } from "../internal/form-field";
import "./select.css";

/** One choice: its visible text and the value it submits. */
export interface SelectOption {
  /** Value submitted under the field's name and passed to the callbacks. */
  value: string;
  /** Visible text of the choice. */
  label: string;
  /** Shown but cannot be chosen, and submits nothing. */
  disabled?: boolean;
}

/** A labelled group of choices. */
export interface SelectGroup {
  /** Visible name of the group. */
  label: string;
  options: SelectOption[];
  /** Every choice in the group is shown but cannot be chosen. */
  disabled?: boolean;
}

export type SelectItem = SelectOption | SelectGroup;

export interface SelectProps {
  /** Visible label. It is the accessible name. */
  label: string;
  /** Supporting guidance, read as part of the accessible description. */
  hint?: string;
  /**
   * What to fix. A non-empty value marks the select invalid, shows the message, adds it to the
   * accessible description, and blocks the form from submitting.
   */
  error?: string;
  /** The choices, in order. A group holds its own `options`. */
  options: SelectItem[];
  /** Form field name. The selected value submits under this name. */
  name?: string;
  /** Selected value (controlled). Pair with `onChange`. */
  value?: string;
  /**
   * Selected value at first (uncontrolled). Form reset restores it. Defaults to the first choice
   * that can be chosen.
   */
  defaultValue?: string;
  /** Prevents choosing. A disabled select submits nothing. */
  disabled?: boolean;
  /** A value must be chosen before the form submits. Shown as "(required)" after the label. */
  required?: boolean;
  /** Called with the new value when a person picks a choice, before `onChange`. */
  onInput?: (value: string) => void;
  /** Called with the new value when a person commits a choice. */
  onChange?: (value: string) => void;
  className?: string;
}

interface FlatOption extends SelectOption {
  unavailable: boolean;
}

function isGroup(item: SelectItem): item is SelectGroup {
  return "options" in item;
}

function flatten(items: SelectItem[]): FlatOption[] {
  return items.flatMap((item) =>
    isGroup(item)
      ? item.options.map((o) => ({ ...o, unavailable: Boolean(item.disabled || o.disabled) }))
      : [{ ...item, unavailable: Boolean(item.disabled) }],
  );
}

function renderOption(option: SelectOption, index: number) {
  return (
    <option key={index} value={option.value} disabled={option.disabled}>
      {option.label}
    </option>
  );
}

export function Select({
  label,
  hint,
  error,
  options,
  name,
  value,
  defaultValue,
  disabled = false,
  required = false,
  onInput,
  onChange,
  className,
}: SelectProps) {
  const flat = useMemo(() => flatten(options), [options]);

  // Content rules that code can check: component.select#named-choices.
  const contentKey = JSON.stringify([label, flat.map((o) => [o.value, o.label])]);
  useEffect(() => {
    if (!label.trim()) {
      console.warn("Select: label is empty. A select needs a visible label that names the value.");
    }
    const seen = new Set<string>();
    for (const option of flat) {
      if (!option.label.trim()) {
        console.warn(`Select: the choice with value "${option.value}" has no visible text.`);
      }
      if (seen.has(option.value)) {
        console.warn(
          `Select: the value "${option.value}" repeats. Each choice needs its own value.`,
        );
      }
      seen.add(option.value);
    }
    // contentKey stands in for label and flat, which change identity on every render.
  }, [contentKey]);

  const [initialValue] = useState(
    () => value ?? defaultValue ?? flat.find((o) => !o.unavailable)?.value ?? "",
  );
  const [current, setInternal, isControlled] = useControllableState(value, initialValue);

  const selectRef = useRef<HTMLSelectElement>(null);

  // Keep the native select in step after every render: a reset or a change to the choices can
  // leave it showing something else. While the value is among the choices it stays selected
  // (component.select#stable-selection). When it is gone, the platform picks a choice and an
  // uncontrolled select adopts it; a controlled one leaves that to the parent.
  useLayoutEffect(() => {
    const select = selectRef.current;
    if (!select) return;
    const present = [...select.options].some((o) => o.value === current);
    if (present && select.value !== current) select.value = current;
    if (!present && !isControlled && select.value !== current) setInternal(select.value);
  });

  // Form reset is not a person's interaction, so it reports nothing. The browser resets the select
  // to a choice React never marked as the default, so restore the initial value after it.
  useFormReset(selectRef, () => {
    if (!isControlled) setInternal(initialValue);
  });
  useNativeInput(selectRef, { error, required });

  const handleInput = (event: FormEvent<HTMLSelectElement>) => {
    onInput?.(event.currentTarget.value);
  };
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.currentTarget.value;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const id = useId();
  const controlId = `${id}-control`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  const describedBy = [hint ? hintId : null, invalid ? errorId : null].filter(Boolean).join(" ");
  const classes = ["ds-select", className].filter(Boolean).join(" ");

  return (
    <div
      className={classes}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      data-required={required || undefined}
    >
      <label className="ds-select__label" htmlFor={controlId}>
        {label}
        {required ? (
          <span className="ds-select__required" aria-hidden="true">
            {" "}
            (required)
          </span>
        ) : null}
      </label>
      <select
        ref={selectRef}
        id={controlId}
        className="ds-select__control"
        name={name}
        value={current}
        disabled={disabled}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy || undefined}
        onInput={handleInput}
        onChange={handleChange}
      >
        {options.map((item, index) =>
          isGroup(item) ? (
            <optgroup key={`group-${index}`} label={item.label} disabled={item.disabled}>
              {item.options.map(renderOption)}
            </optgroup>
          ) : (
            renderOption(item, index)
          ),
        )}
      </select>
      {hint ? (
        <div id={hintId} className="ds-select__hint">
          {hint}
        </div>
      ) : null}
      {invalid ? (
        <div id={errorId} className="ds-select__error">
          {error}
        </div>
      ) : null}
    </div>
  );
}
