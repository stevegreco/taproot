/**
 * Verify: run the steps in `checkbox.verify.js`. The docs tests run them against the built site.
 */
import { useState } from "react";
import "@stevegreco/web-components";

const CHANNELS = [
  { name: "email", label: "Email" },
  { name: "push", label: "Push" },
  { name: "sms", label: "Text message" },
] as const;

type Channel = (typeof CHANNELS)[number]["name"];

export default function CheckboxExample() {
  const [channels, setChannels] = useState<Record<Channel, boolean>>({
    email: true,
    push: false,
    sms: false,
  });
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState("");

  const on = CHANNELS.filter(({ name }) => channels[name]);
  const all = on.length === CHANNELS.length;
  const some = on.length > 0 && !all;

  return (
    <div className="flex flex-col gap-8 p-6 text-slate-900 dark:text-white">
      <form
        className="flex w-full max-w-sm flex-col items-stretch gap-4"
        data-checkbox-form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          if (!data.has("terms")) {
            setError("Agree to the terms to continue.");
            setSubmitted("");
            return;
          }
          setError("");
          const chosen = data.getAll("channels");
          setSubmitted(chosen.length > 0 ? chosen.join(", ") : "no channels");
        }}
      >
        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
          <legend className="mb-3 p-0 text-sm font-semibold">Notifications</legend>
          <ds-checkbox
            checked={all}
            data-checkbox-all
            indeterminate={some}
            label="All channels"
            onChange={() => {
              const next = !all;
              setChannels({ email: next, push: next, sms: next });
            }}
          />
          <div className="flex flex-col gap-3 ps-6">
            {CHANNELS.map(({ name, label }) => (
              <ds-checkbox
                checked={channels[name]}
                key={name}
                label={label}
                name="channels"
                onChange={(event) => {
                  const target = event.currentTarget as HTMLElement & { checked: boolean };
                  setChannels((current) => ({ ...current, [name]: target.checked }));
                }}
                value={name}
              />
            ))}
          </div>
        </fieldset>
        <ds-checkbox
          error={error}
          hint="You can withdraw at any time."
          label="I agree to the terms"
          name="terms"
          onChange={() => {
            if (error) setError("");
          }}
          required
        />
        <div>
          <ds-button type="submit">Continue</ds-button>
        </div>
        <p className="m-0 text-sm text-slate-600 dark:text-slate-300" data-checkbox-status>
          {submitted ? `Saved: ${submitted}.` : "Agree to the terms to continue."}
        </p>
      </form>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <ds-checkbox disabled label="Disabled" />
        <ds-checkbox checked disabled label="Disabled and checked" />
        <ds-checkbox disabled indeterminate label="Disabled and indeterminate" />
      </div>
    </div>
  );
}
