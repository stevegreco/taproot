import * as React from "react";
import { Link } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/link.stories.js.
export const Standalone = () => (
  <Link href="#" variant="standalone">
    View release notes
  </Link>
);

export const Inline = () => (
  <p>
    Read our{" "}
    <Link href="#" variant="inline">
      privacy policy
    </Link>{" "}
    before you continue.
  </p>
);
