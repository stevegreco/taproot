import * as React from "react";
import { Slider } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/slider.stories.js.
const Volume = (props: React.ComponentProps<typeof Slider>) => (
  <Slider label="Volume" value={40} min={0} max={100} step={1} name="volume" {...props} />
);

export const Default = () => <Volume />;

export const WithHint = () => (
  <Slider
    label="Maximum price (USD)"
    hint="Shows homes at or below this price."
    name="max-price"
    min={0}
    max={2000}
    step={50}
    value={800}
  />
);

export const WithError = () => (
  <Volume label="Budget (USD)" value={90} error="Choose 50 or less for this plan." />
);

export const Disabled = () => <Volume disabled />;

export const AtMinimum = () => <Volume value={0} />;

export const AtMaximum = () => <Volume value={100} />;

export const RightToLeft = () => (
  <div dir="rtl">
    <Slider label="Volume" value={30} />
  </div>
);
