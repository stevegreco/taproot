import "@stevegreco/design-system-components";

export default function BadgeExample() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-6">
      <ds-badge>Default</ds-badge>
      <ds-badge variant="accent">Accent</ds-badge>
      <ds-badge variant="success">Active</ds-badge>
      <ds-badge variant="danger">Failed</ds-badge>
      <ds-badge variant="warning">Pending</ds-badge>
      <ds-badge variant="info">Beta</ds-badge>
    </div>
  );
}
