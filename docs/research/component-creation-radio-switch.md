# Radio group and Switch creation feedback

Specs were written and reviewed before runtime work. Checkbox supplied the shape for label, hint, error and form association.

- The parameter schema supports scalar values only. Radio group options need labels, values and disabled state. The spec records options as anatomy and rules; the web mapping documents its ordered native option children. A future schema could describe repeated content explicitly without importing platform types.
- The existing Checkbox spec still names web concepts such as attributes and native controls. Copying it wholesale would carry those into new contracts. A technology-neutral template would help.
- Query commands can stall in this environment through the pnpm shim. Calling the checked-in CLI directly keeps knowledge queries available after dependencies are installed.
- Token discovery found semantic.radius.pill after the initial draft used a radius primitive. A token search step in the creation workflow would prevent that fallback.
- Radio choices must share one native grouping scope. Rendering separate shadow-root radio components would lose native arrow navigation and exclusivity. One group-owned set avoids a bespoke keyboard model.

Review caught two gaps in the shared helpers. `ForwardsFocus` assumes a control always exists,
while an empty or disabled option group has no enabled focus target. The group supplies guarded
focus and blur methods. The shared host checks should include empty and all-disabled collections.

The form-control reference updated form state on change only. A consumer reading `FormData`
in an input handler could see the old value. Both new controls update form state and dirty state
before the native input event reaches the host. Shared form tests should cover this event order.

A broad light-DOM mutation observer initially rebuilt radios when hint, error, or direction
changed. That discarded focus. The observer now ignores host attribute mutations and restores
focus by option value when the option collection changes. Collection-based components need
focus-preservation checks in the creation checklist.

Validation completed for these two components: all required creation-status entries are present,
and 16 component browser tests pass, including event ordering, keyboard selection, dynamic
options, form reset and restore, forced colors, RTL, and empty or disabled focus handling.
