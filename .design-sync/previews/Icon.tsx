import * as React from "react";
import { Badge, Button, Icon } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/icon.stories.js. Icon wraps an inline SVG you supply.
const Warning = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2 22 21H2zm-1 7v6h2V9zm0 8v2h2v-2z" />
  </svg>
);
const Trash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);

export const Default = () => (
  <Icon size="large" label="Warning">
    <Warning />
  </Icon>
);

export const Decorative = () => (
  <Icon size="large" label="">
    <Warning />
  </Icon>
);

export const AllSizes = () => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
    {(["small", "medium", "large"] as const).map((size) => (
      <Icon key={size} size={size}>
        <Warning />
      </Icon>
    ))}
  </div>
);

export const InheritsTextSize = () => (
  <>
    <p style={{ fontSize: 14 }}>
      Small text{" "}
      <Icon>
        <Warning />
      </Icon>
    </p>
    <p style={{ fontSize: 32 }}>
      Large text{" "}
      <Icon>
        <Warning />
      </Icon>
    </p>
  </>
);

export const InComponents = () => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
    <Button variant="destructive">
      <Icon>
        <Trash />
      </Icon>
      Delete project
    </Button>
    <Button variant="secondary" disabled>
      <Icon>
        <Trash />
      </Icon>
      Delete archive
    </Button>
    <Badge variant="warning">
      <Icon>
        <Warning />
      </Icon>{" "}
      Pending
    </Badge>
  </div>
);
