/**
 * Verify: run the steps in `text-area.verify.js`. The docs tests run them against the built site.
 */
import { useState } from "react";
import "@stevegreco/design-system-components";

export default function TextAreaExample() {
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState("");
  return (
    <form
      data-text-area-form
      className="flex w-full max-w-sm flex-col gap-4 p-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get("description") ?? "").trim();
        if (!value) {
          setError("Describe the project.");
          setSubmitted("");
          return;
        }
        setError("");
        setSubmitted(value);
      }}
    >
      <ds-text-area
        data-text-area-control
        label="Project description"
        name="description"
        hint="Explain what the project will do."
        error={error}
        onInput={() => setError("")}
      />
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
      <p data-text-area-status>{submitted ? `Saved ${submitted}.` : "Choose a value and save."}</p>
    </form>
  );
}
