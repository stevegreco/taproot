import { useState } from "react";
import "@stevegreco/design-system-components";

export default function ButtonExample() {
  const [clicks, setClicks] = useState(0);

  return (
    <div className="flex flex-col gap-6 p-6 text-slate-900 dark:text-white">
      <div className="flex flex-wrap items-center gap-3">
        <ds-button onClick={() => setClicks((count) => count + 1)}>Primary</ds-button>
        <ds-button variant="secondary">Secondary</ds-button>
        <ds-button variant="ghost">Ghost</ds-button>
        <ds-button variant="danger">Delete</ds-button>
        <ds-button disabled>Disabled</ds-button>
      </div>
      <p className="m-0 text-sm text-slate-600 dark:text-slate-300">
        Primary button clicked {clicks} {clicks === 1 ? "time" : "times"}.
      </p>
    </div>
  );
}
