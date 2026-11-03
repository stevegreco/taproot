/**
 * Verify: run the steps in `radio-group.verify.js`. The docs tests run them against the built site.
 */
import { useState } from "react";
import "@stevegreco/web-components";
export default function RadioGroupExample() {
  const [saved, setSaved] = useState("");
  return (
    <form
      data-radio-group-form
      className="flex flex-col gap-4 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(String(new FormData(event.currentTarget).get("delivery")));
      }}
    >
      <ds-radio-group
        data-radio-group-control
        label="Delivery method"
        hint="Choose how your order arrives."
        name="delivery"
        value="standard"
        required
      >
        <option value="standard">Standard delivery</option>
        <option value="express">Express delivery</option>
        <option value="pickup" disabled>
          Pickup unavailable
        </option>
      </ds-radio-group>
      <div>
        <ds-button type="submit">Save delivery</ds-button> <ds-button type="reset">Reset</ds-button>
      </div>
      <p data-radio-group-status>{saved ? `Saved: ${saved}.` : "Choose delivery then save."}</p>
    </form>
  );
}
