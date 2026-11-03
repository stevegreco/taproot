/**
 * Verify: run the steps in `select.verify.js`. The docs tests run them against the built site.
 */
import { useState } from "react";
import "@stevegreco/web-components";

export default function SelectExample() {
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState("");
  return (
    <form
      data-select-form
      className="flex w-full max-w-sm flex-col gap-4 p-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get("delivery") ?? "").trim();
        if (!value) {
          setError("Choose a delivery method.");
          setSubmitted("");
          return;
        }
        setError("");
        setSubmitted(value);
      }}
    >
      <ds-select
        data-select-control
        label="Delivery method"
        name="delivery"
        hint="Choose how soon your order should arrive."
        error={error}
        onInput={() => setError("")}
      >
        <option value="">Choose delivery</option>
        <option value="standard">Standard</option>
        <option value="express">Express</option>
      </ds-select>
      <div className="flex gap-2">
        <ds-button type="submit">Save</ds-button>
        <ds-button
          type="reset"
          variant="secondary"
          onClick={() => {
            setError("");
            setSubmitted("");
          }}
        >
          Reset
        </ds-button>
      </div>
      <p data-select-status>{submitted ? `Saved ${submitted}.` : "Choose a value and save."}</p>
    </form>
  );
}
