import { html, svg } from "lit";

const media = svg`<svg slot="media" viewBox="0 0 320 120" role="presentation" style="display:block;width:100%;height:auto"><rect width="320" height="120" fill="currentColor" opacity="0.12"/><path d="M20 100 90 60l50 25 60-50 100 40" fill="none" stroke="currentColor" stroke-width="4"/></svg>`;

export default {
  title: "Components/Card",
  component: "ds-card",
  argTypes: {
    label: { control: "text" },
    href: { control: "text" },
    headingLevel: { control: "number" },
    body: { control: "text", description: "Slotted content." },
  },
  args: {
    label: "Quarterly revenue report",
    href: "",
    headingLevel: 3,
    body: "Revenue grew 12% over the previous quarter.",
  },
  render: (args) => html`
    <div style="max-width: 320px">
      <ds-card label=${args.label} href=${args.href} heading-level=${args.headingLevel}>
        ${args.body}
      </ds-card>
    </div>
  `,
};

export const Default = {};

export const WithDestination = {
  args: { href: "#q3-report" },
};

export const WithMediaAndActions = {
  render: () => html`
    <div style="max-width: 320px">
      <ds-card label="Quarterly revenue report" href="#q3-report">
        ${media} Revenue grew 12% over the previous quarter.
        <ds-badge variant="success">Published</ds-badge>
        <ds-button slot="actions" variant="tertiary" size="small">Share</ds-button>
      </ds-card>
    </div>
  `,
};

export const Collection = {
  render: () => html`
    <ul
      style="list-style:none;margin:0;padding:0;display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))"
    >
      ${[
        ["Quarterly revenue report", "Revenue grew 12% over the previous quarter."],
        ["Hiring plan", "Four open roles across design and engineering."],
        ["Office move", "The new space opens in March. Desks are assigned by team."],
      ].map(
        ([label, body]) => html`
          <li>
            <ds-card label=${label} href="#${label}">
              ${body}
              <ds-button slot="actions" variant="tertiary" size="small">Share</ds-button>
            </ds-card>
          </li>
        `,
      )}
    </ul>
  `,
};
