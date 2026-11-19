import * as React from "react";
import { Badge, Icon } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/badge.stories.js.
export const Default = () => <Badge variant="default">Draft</Badge>;

export const Success = () => <Badge variant="success">Published</Badge>;

export const Danger = () => <Badge variant="danger">Failed</Badge>;

export const AllVariants = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    {(["default", "accent", "success", "danger", "warning", "info"] as const).map((variant) => (
      <Badge key={variant} variant={variant}>
        {variant}
      </Badge>
    ))}
  </div>
);

export const WithIcon = () => (
  <Badge variant="warning">
    <Icon>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2 22 21H2zm-1 7v6h2V9zm0 8v2h2v-2z" />
      </svg>
    </Icon>
    Pending
  </Badge>
);
