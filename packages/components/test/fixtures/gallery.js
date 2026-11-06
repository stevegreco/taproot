/**
 * One realistic sample of every web component. The accessibility and visual
 * regression tests both render these, so a component added here is covered
 * by both.
 */
const icon = `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>`;

export const gallery = {
  accordion: `
    <ds-accordion heading-level="2">
      <ds-accordion-section label="How long does delivery take?" expanded>
        <p>Three to five days.</p>
      </ds-accordion-section>
      <ds-accordion-section label="Can I return an item?">
        <p>Within 30 days.</p>
      </ds-accordion-section>
    </ds-accordion>`,
  alert: `
    <ds-alert variant="success" label="Changes saved" dismissible>Your profile is up to date.</ds-alert>
    <ds-alert variant="danger" label="Upload failed">
      <ds-icon slot="icon" label="Error">${icon}</ds-icon>
      Too large.
      <ds-button slot="actions" variant="secondary" size="small">Choose another file</ds-button>
    </ds-alert>
    <ds-alert variant="warning" label="Storage almost full">Remove old files.</ds-alert>
    <ds-alert variant="info" label="New version">Reload to update.</ds-alert>`,
  avatar: `
    <ds-avatar name="Grace Hopper" size="large"></ds-avatar>
    <ds-avatar name="Ada Lovelace" size="small" decorative></ds-avatar> Ada Lovelace`,
  badge: `
    <ds-badge variant="success">Active</ds-badge>
    <ds-badge variant="warning">Pending</ds-badge>
    <ds-badge variant="danger">Failed</ds-badge>
    <ds-badge variant="info">New</ds-badge>
    <ds-badge>Draft</ds-badge>`,
  button: `
    <ds-button>Save</ds-button>
    <ds-button variant="secondary">Cancel</ds-button>
    <ds-button variant="tertiary">Skip</ds-button>
    <ds-button variant="destructive">Delete</ds-button>
    <ds-button size="small">Small</ds-button>
    <ds-button disabled>Disabled</ds-button>`,
  card: `
    <ul>
      <li>
        <ds-card label="Quarterly report" href="/q3">
          Revenue grew.
          <ds-badge variant="success">Published</ds-badge>
          <ds-button slot="actions" variant="tertiary" size="small">Share</ds-button>
        </ds-card>
      </li>
    </ul>`,
  checkbox: `
    <ds-checkbox label="Email me" name="updates" hint="Monthly." checked></ds-checkbox>
    <ds-checkbox label="Accept the terms" name="terms" required error="Accept the terms to continue"></ds-checkbox>
    <ds-checkbox label="Unavailable" disabled></ds-checkbox>`,
  dialog: `
    <ds-dialog label="Delete this project?" description="This can't be undone." open>
      <ds-button slot="actions" variant="secondary">Cancel</ds-button>
      <ds-button slot="actions" variant="destructive">Delete</ds-button>
    </ds-dialog>`,
  // A divider on the page and one inside a card: their backgrounds differ.
  divider: `
    <ds-divider></ds-divider>
    <ds-card label="Inside a card">
      Above the line.
      <ds-divider></ds-divider>
      Below the line.
    </ds-card>`,
  icon: `<ds-icon label="Status">${icon}</ds-icon>`,
  link: `
    <p>
      <ds-link href="/inline">Inline link</ds-link> and
      <ds-link variant="standalone" href="/projects">View all projects</ds-link>
    </p>`,
  "progress-bar": `<ds-progress-bar label="Uploading" value="40"></ds-progress-bar>`,
  "radio-group": `
    <ds-radio-group label="Delivery" name="delivery" value="standard" required>
      <option value="standard">Standard</option>
      <option value="express">Express</option>
    </ds-radio-group>`,
  select: `
    <ds-select label="Method" name="method" required error="Choose a method">
      <option value="">Choose</option>
      <option value="post">Post</option>
    </ds-select>`,
  spinner: `<ds-spinner label="Saving draft"></ds-spinner>`,
  switch: `
    <ds-switch label="Notifications" hint="Sent right away." checked></ds-switch>
    <ds-switch label="Unavailable" disabled></ds-switch>`,
  tabs: `
    <ds-tabs label="Account" value="profile">
      <ds-tab-panel label="Profile" value="profile">Your details.</ds-tab-panel>
      <ds-tab-panel label="Billing" value="billing">Your invoices.</ds-tab-panel>
    </ds-tabs>`,
  "text-area": `<ds-text-area label="About you" name="about" rows="2"></ds-text-area>`,
  "text-field": `
    <ds-text-field label="Email" name="email" type="email" hint="For signing in." error="Add an @"></ds-text-field>
    <ds-text-field label="Unavailable" disabled></ds-text-field>`,
  tooltip: `
    <ds-tooltip label="Delete row">
      <ds-button variant="tertiary" size="small"><ds-icon>${icon}</ds-icon></ds-button>
    </ds-tooltip>`,
};

export const themes = ["light", "dark"];

/** Render one gallery sample on a themed page and return its container. */
export async function renderSample(name, theme) {
  document.documentElement.dataset.theme = theme;
  document.body.style.margin = "0";
  const container = document.createElement("main");
  container.style.cssText = `
    display: grid;
    gap: var(--ds-primitives-space-4);
    padding: var(--ds-primitives-space-6);
    background: var(--ds-semantic-color-background-default);
    color: var(--ds-semantic-color-foreground-default);
    font-family: var(--ds-semantic-typography-body-md-font-family);
  `;
  container.innerHTML = gallery[name];
  document.body.replaceChildren(container);
  await document.fonts.ready;
  await new Promise(requestAnimationFrame);
  return container;
}
