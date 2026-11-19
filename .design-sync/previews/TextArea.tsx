import * as React from "react";
import { TextArea } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/text-area.stories.js.
const Description = (props: React.ComponentProps<typeof TextArea>) => (
  <div style={{ maxWidth: "24rem" }}>
    <TextArea
      label="Text area"
      name="description"
      value=""
      placeholder=""
      autocomplete=""
      rows={4}
      {...props}
    />
  </div>
);

export const Default = () => <Description />;

export const WithHint = () => <Description hint="Choose a value for this project." />;

export const WithError = () => <Description required error="Provide a value to continue." />;

export const Disabled = () => <Description disabled />;

export const Required = () => <Description required />;

export const Readonly = () => <Description readonly value="Existing project notes." />;

export const Multiline = () => (
  <Description rows={6} value={"First line\nSecond line\nThird line"} />
);
