import * as React from "react";
import { Badge, Button, Card } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/card.stories.js.
const Media = () => (
  <svg
    slot="media"
    viewBox="0 0 320 120"
    role="presentation"
    style={{ display: "block", width: "100%", height: "auto" }}
  >
    <rect width="320" height="120" fill="currentColor" opacity="0.12" />
    <path d="M20 100 90 60l50 25 60-50 100 40" fill="none" stroke="currentColor" strokeWidth="4" />
  </svg>
);

export const Default = () => (
  <div style={{ maxWidth: 320 }}>
    <Card label="Quarterly revenue report" href="" headingLevel={3}>
      Revenue grew 12% over the previous quarter.
    </Card>
  </div>
);

export const WithDestination = () => (
  <div style={{ maxWidth: 320 }}>
    <Card label="Quarterly revenue report" href="#q3-report" headingLevel={3}>
      Revenue grew 12% over the previous quarter.
    </Card>
  </div>
);

export const WithMediaAndActions = () => (
  <div style={{ maxWidth: 320 }}>
    <Card label="Quarterly revenue report" href="#q3-report">
      <Media /> Revenue grew 12% over the previous quarter.
      <Badge variant="success">Published</Badge>
      <Button slot="actions" variant="tertiary" size="small">
        Share
      </Button>
    </Card>
  </div>
);

export const Collection = () => (
  <ul
    style={{
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "grid",
      gap: 16,
      gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
    }}
  >
    {[
      ["Quarterly revenue report", "Revenue grew 12% over the previous quarter."],
      ["Hiring plan", "Four open roles across design and engineering."],
      ["Office move", "The new space opens in March. Desks are assigned by team."],
    ].map(([label, body]) => (
      <li key={label}>
        <Card label={label} href={`#${label}`}>
          {body}
          <Button slot="actions" variant="tertiary" size="small">
            Share
          </Button>
        </Card>
      </li>
    ))}
  </ul>
);
