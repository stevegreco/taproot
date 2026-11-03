/**
 * Slider wraps React Aria's Slider with one thumb. React Aria reports every new value through
 * `onChange` and the end of a drag or key press through `onChangeEnd`; this component maps them to
 * the spec's input and change, and filters what the spec does not count as a person's change.
 */
import { useEffect, useId, useRef, useState } from "react";
import {
  I18nProvider,
  Label,
  Slider as AriaSlider,
  SliderFill,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";
import { useDirectionLocale } from "../internal/direction";
import { useControllableState, useFormReset, useNativeInput } from "../internal/form-field";
import "./slider.css";

export interface SliderProps {
  /** Visible label. It is the accessible name. Put units here, such as "Volume (%)". */
  label: string;
  /** Supporting guidance, read as part of the accessible description. */
  hint?: string;
  /**
   * What to fix. A non-empty value marks the slider invalid, shows the message, adds it to the
   * accessible description, and blocks the form from submitting.
   */
  error?: string;
  /** Current value (controlled). Pair with `onInput` or `onChange`. */
  value?: number;
  /** Value at first (uncontrolled). Form reset restores it. Defaults to `min`. */
  defaultValue?: number;
  /** Smallest value. Defaults to 0. */
  min?: number;
  /** Largest value. Defaults to 100. */
  max?: number;
  /** Distance between the values people can choose, counted from `min`. Defaults to 1. */
  step?: number;
  /** Form field name. The value submits under this name. */
  name?: string;
  /** Prevents changing the value. A disabled slider submits nothing. */
  disabled?: boolean;
  /** Called with every new value while a person drags the thumb or presses a key. */
  onInput?: (value: number) => void;
  /** Called once when a person releases the thumb or key, if the value changed. */
  onChange?: (value: number) => void;
  className?: string;
}

/** The nearest value on a step, between min and max (component.slider#value-in-range). */
function snap(value: number, min: number, max: number, step: number): number {
  const steps = Math.round((value - min) / step);
  // Round away floating point noise, such as 0.30000000000000004, to the step's precision.
  const decimals = (String(step).split(".")[1] ?? "").length;
  const snapped = Number((min + steps * step).toFixed(decimals));
  // The last step can pass max when the range is not a whole number of steps.
  const top = min + Math.floor((max - min) / step) * step;
  return Math.min(Math.max(snapped, min), Number(top.toFixed(decimals)));
}

export function Slider({
  label,
  hint,
  error,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  name,
  disabled = false,
  onInput,
  onChange,
  className,
}: SliderProps) {
  useEffect(() => {
    if (!label.trim()) {
      console.warn("Slider: label is empty. A slider needs a visible label that names the value.");
    }
    if (!(max > min)) {
      console.warn(`Slider: max (${max}) must be greater than min (${min}).`);
    }
    if (!(step > 0)) {
      console.warn(`Slider: step (${step}) must be greater than 0.`);
    }
  }, [label, min, max, step]);

  const [initialValue] = useState(() => value ?? defaultValue ?? min);
  const [kept, setKept, isControlled] = useControllableState(value, initialValue);
  const current = snap(kept, min, max, step);

  const inputRef = useRef<HTMLInputElement>(null);
  // React Aria restores the native input on reset by calling onChange; that is not a person's
  // change, so it reports nothing (component.slider#programmatic-no-events).
  const resetting = useFormReset(inputRef, () => {
    if (!isControlled) setKept(initialValue);
  });
  useNativeInput(inputRef, { error });

  // The value before a person started, for component.slider#change-on-release. It follows the
  // value set from outside, but not while a person is changing it.
  const committed = useRef(current);
  const interacting = useRef(false);
  useEffect(() => {
    if (!interacting.current) committed.current = current;
  }, [current]);

  const handleInput = (next: number) => {
    if (resetting.current || next === current) return;
    interacting.current = true;
    if (!isControlled) setKept(next);
    onInput?.(next);
  };
  const handleChangeEnd = (next: number) => {
    interacting.current = false;
    if (resetting.current || next === committed.current) return;
    committed.current = next;
    onChange?.(next);
  };

  // The thumb's position and arrow keys follow React Aria's locale; follow the page instead
  // (component.slider rationale: right-to-left). Only the track gets the locale, so the value text
  // keeps the reader's number format.
  const rootRef = useRef<HTMLDivElement>(null);
  const locale = useDirectionLocale(rootRef);

  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  const describedBy = [hint ? hintId : null, invalid ? errorId : null].filter(Boolean).join(" ");
  const classes = ["ds-slider", className].filter(Boolean).join(" ");

  const track = (
    <SliderTrack className="ds-slider__track">
      <SliderFill className="ds-slider__fill" />
      <SliderThumb
        className="ds-slider__thumb"
        inputRef={inputRef}
        name={name}
        isInvalid={invalid}
        aria-describedby={describedBy || undefined}
      />
    </SliderTrack>
  );

  return (
    <AriaSlider
      ref={rootRef}
      className={classes}
      value={current}
      minValue={min}
      maxValue={max}
      step={step}
      isDisabled={disabled}
      onChange={handleInput}
      onChangeEnd={handleChangeEnd}
      data-invalid={invalid || undefined}
    >
      <div className="ds-slider__header">
        <Label className="ds-slider__label">{label}</Label>
        <SliderOutput className="ds-slider__value" />
      </div>
      {locale ? <I18nProvider locale={locale}>{track}</I18nProvider> : track}
      {hint ? (
        <div id={hintId} className="ds-slider__hint">
          {hint}
        </div>
      ) : null}
      {invalid ? (
        <div id={errorId} className="ds-slider__error">
          {error}
        </div>
      ) : null}
    </AriaSlider>
  );
}
