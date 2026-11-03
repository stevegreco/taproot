/**
 * Verify: run the steps in `text-field.verify.js`. The docs tests run them against the built site.
 */
import { useState } from "react";
import "@stevegreco/web-components";

export default function TextFieldExample() {
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState("");

  return (
    <div className="flex flex-col gap-8 p-6 text-slate-900 dark:text-white">
      <form
        className="flex w-full max-w-sm flex-col items-stretch gap-4"
        data-text-field-form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const email = String(data.get("email") ?? "").trim();
          if (!email.includes("@")) {
            setError("Enter an email address with an @ sign.");
            setSubmitted("");
            return;
          }
          setError("");
          setSubmitted(email);
        }}
      >
        <ds-text-field
          autocomplete="email"
          error={error}
          hint="Used for sign-in and account recovery."
          label="Email"
          name="email"
          onInput={() => {
            if (error) setError("");
          }}
          placeholder="you@example.com"
          type="email"
        />
        <div>
          <ds-button type="submit">Continue</ds-button>
        </div>
        <p className="m-0 text-sm text-slate-600 dark:text-slate-300" data-text-field-status>
          {submitted ? `Submitted ${submitted}.` : "Submit an email to continue."}
        </p>
      </form>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <ds-text-field hint="Shown on your profile." label="Display name" value="Ada Lovelace" />
        <ds-text-field error="Choose a workspace name." label="Workspace" />
        <ds-text-field disabled label="API token" value="hidden" />
      </div>
    </div>
  );
}
