import * as React from "react";
import { Button, Icon, Tooltip } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/tooltip.stories.js. Tooltip wraps the control it names.
const glyph = (d: string) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);
const trash = glyph("M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5");
const pencil = glyph("M10.5 2.5l3 3L6 13H3v-3z");
const copy = glyph("M5.5 5.5h7v7h-7zM3.5 10.5v-7h7");

const IconButton = ({
  label,
  graphic,
  placement = "above",
}: {
  label: string;
  graphic: React.ReactNode;
  placement?: "above" | "below";
}) => (
  <Tooltip label={label} placement={placement}>
    <Button variant="tertiary" size="small">
      <Icon>{graphic}</Icon>
    </Button>
  </Tooltip>
);

export const Default = () => (
  <div style={{ padding: 48 }}>
    <IconButton label="Delete row" graphic={trash} />
  </div>
);

export const Below = () => (
  <div style={{ padding: 48 }}>
    <IconButton label="Delete row" graphic={trash} placement="below" />
  </div>
);

export const Toolbar = () => (
  <div style={{ padding: 48, display: "flex", gap: 4 }}>
    <IconButton label="Edit row" graphic={pencil} />{" "}
    <IconButton label="Duplicate row" graphic={copy} />{" "}
    <IconButton label="Delete row" graphic={trash} />
  </div>
);

export const FlipsAtEdge = () => (
  <div style={{ display: "flex", justifyContent: "flex-end" }}>
    <IconButton label="Delete row" graphic={trash} />
  </div>
);

export const InsideClippedContainer = () => (
  <div style={{ margin: 48, width: 40, height: 40, overflow: "hidden" }}>
    <IconButton label="Remove this row and every row below it" graphic={trash} />
  </div>
);
