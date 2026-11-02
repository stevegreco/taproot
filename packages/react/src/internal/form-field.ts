/**
 * Shared behavior for form controls that wrap a React Aria field around a native input.
 *
 * React Aria runs with `validationBehavior="aria"`, so it marks a field invalid only when the error
 * prop says so. The native input still carries the constraints that block submit: `required`, and
 * the error text as its validation message, which the browser shows instead of a generic one.
 *
 * A form reset is not a person's interaction, so it reports no change. React Aria restores its
 * initial value on reset by calling the change handler; components ignore those calls while
 * `useFormReset` reports a reset in progress.
 */
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

export const validationBehavior = "aria";

/**
 * A value the parent controls when `value` is defined, and the component keeps otherwise. Returns
 * the current value, the setter for the kept value, and whether the parent controls it.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
): readonly [T, (next: T) => void, boolean] {
  const [kept, setKept] = useState(defaultValue);
  const controlled = value !== undefined;
  return [controlled ? value : kept, setKept, controlled];
}

/**
 * Keep the native input in step with what the component renders: its checked state, `required`,
 * and the error as its validation message. A native reset can leave a controlled input stale, so
 * this runs after every render.
 */
export function useNativeInput(
  inputRef: RefObject<HTMLInputElement | null>,
  { checked, error, required = false }: { checked?: boolean; error?: string; required?: boolean },
): void {
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (checked !== undefined && input.checked !== checked) input.checked = checked;
    input.required = required;
    input.setCustomValidity(error ?? "");
  });
}

/**
 * Watch the input's form for reset. While a reset is in progress the returned ref is true, so the
 * component can ignore the change React Aria reports for it. After the browser has reset its
 * controls, `onReset` runs and the component renders again, so `useNativeInput` resyncs the input.
 */
export function useFormReset(
  inputRef: RefObject<HTMLInputElement | null>,
  onReset: () => void,
): RefObject<boolean> {
  const resetting = useRef(false);
  const latest = useRef(onReset);
  const [, rerender] = useState(0);
  useLayoutEffect(() => {
    latest.current = onReset;
  });
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handleReset = () => {
      resetting.current = true;
      // The browser resets the controls after the reset event, so restore state after that.
      timer = setTimeout(() => {
        resetting.current = false;
        latest.current();
        rerender((n) => n + 1);
      }, 0);
    };
    // Capture runs before React Aria's own reset listener on the same form.
    form.addEventListener("reset", handleReset, true);
    return () => {
      form.removeEventListener("reset", handleReset, true);
      clearTimeout(timer);
    };
  }, [inputRef]);
  return resetting;
}
