/**
 * Verify: run the steps in `icon.verify.js`. The docs tests run them against the built site.
 */
import "@stevegreco/design-system-components";

const trash = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);

const warning = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2 22 21H2zm-1 7v6h2V9zm0 8v2h2v-2z" fillRule="evenodd" />
  </svg>
);

const arrow = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function IconExample() {
  return (
    <div className="flex flex-col gap-8 p-6 text-slate-900 dark:text-white" data-icon-example>
      <div className="flex flex-wrap items-center gap-3">
        <ds-button variant="destructive" data-icon-button>
          <ds-icon>{trash}</ds-icon>
          Delete project
        </ds-button>
        <ds-button variant="secondary" disabled data-icon-disabled>
          <ds-icon>{trash}</ds-icon>
          Delete archive
        </ds-button>
        <ds-badge variant="warning">
          <ds-icon>{warning}</ds-icon> Pending
        </ds-badge>
      </div>

      <p className="m-0 flex items-center gap-2">
        Storage used: 96%
        <ds-icon size="medium" label="Warning" data-icon-labeled>
          {warning}
        </ds-icon>
      </p>

      <ds-link href="#icon-usage" variant="standalone" data-icon-link>
        View usage details <ds-icon>{arrow}</ds-icon>
      </ds-link>

      <div className="flex items-end gap-4" data-icon-sizes>
        <ds-icon size="small">{warning}</ds-icon>
        <ds-icon size="medium">{warning}</ds-icon>
        <ds-icon size="large">{warning}</ds-icon>
      </div>
    </div>
  );
}
