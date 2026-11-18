import * as React from "react";
import { Alert, Spinner } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/spinner.stories.js.
export const Default = () => <Spinner label="Loading" size="large" />;

export const AllSizes = () => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
    {(["small", "medium", "large"] as const).map((size) => (
      <Spinner key={size} size={size} />
    ))}
  </div>
);

export const BesideText = () => (
  <>
    <p style={{ fontSize: 14 }}>
      <Spinner label="Saving draft" /> Saving…
    </p>
    <p style={{ fontSize: 24 }}>
      <Spinner label="Uploading photo" /> Uploading…
    </p>
  </>
);

export const LoadingRegion = () => (
  <section
    aria-busy="true"
    style={{
      display: "grid",
      placeItems: "center",
      minBlockSize: 200,
      border: "1px solid var(--ds-semantic-color-border-default)",
      borderRadius: "var(--ds-semantic-radius-surface)",
    }}
  >
    <Spinner size="large" label="Loading comments" />
  </section>
);

export const OnStatusSurface = () => (
  <Alert variant="info">
    <Spinner slot="icon" label="Importing contacts" />
    Importing contacts. This can take a few minutes.
  </Alert>
);
