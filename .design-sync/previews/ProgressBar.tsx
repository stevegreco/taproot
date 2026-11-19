import * as React from "react";
import { ProgressBar } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/progress-bar.stories.js.
export const Default = () => <ProgressBar label="Uploading report.pdf" value={40} max={100} />;

export const Empty = () => <ProgressBar label="Waiting to upload" value={0} max={100} />;

export const Complete = () => <ProgressBar label="Upload complete" value={100} max={100} />;

export const CustomMax = () => (
  <ProgressBar label="Importing 3 of 12 contacts" value={3} max={12} />
);

export const RightToLeft = () => (
  <div dir="rtl">
    <ProgressBar label="جارٍ رفع الملف" value={40} max={100} />
  </div>
);
