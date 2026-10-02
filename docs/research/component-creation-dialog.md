# Dialog component creation feedback

The spec was drafted before runtime work. The main decisions are modal-only behavior, a visible title,
focus on the title by default, focus restoration, cancelable dismissal, explicit composed actions,
no backdrop dismissal, and viewport-bounded scrolling.

The current schema can express focus lifecycle requirements as behavior and accessibility rules.
No schema change is necessary for this component. Parameters cannot express a control reference for
initial focus, so the neutral initial-focus rule names the capability and web documentation explains
how consumers designate a control. This is an implementation mapping rather than a new parameter.

The creation checklist assumes every component has one inner interactive control and a required
slot. Dialog has an inner modal container, optional content, and composed actions. Shared host checks
need an explicit Dialog row that reflects these differences rather than copying a form-control row.

The checklist’s spec-first step gives no review boundary. For this work, the parent agent reviews the
contract before implementation starts. This made focus defaults and dismissal decisions reviewable
before web APIs obscured them.

Browser verification covers thirteen behaviors, including actual Tab and Shift+Tab wrapping through
both native buttons and composed buttons with open shadow roots. Native modal blocking protects the
surrounding controls; a small explicit boundary handler keeps keyboard focus within the conversation.
Hidden and disconnected hosts release the scroll lock and restore its previous inline value and
priority. Immediate close and reopen does not let a queued native close event close the new dialog.

Knowledge validation accepts opaque token references, as documented. It does not catch an invented
token path. Review caught `primitives.fontWeight.semibold`, while the published token is
`primitives.weight.semibold`. A consumer-facing token lookup command, or an optional adopter token
resolver during validation, would make this easier to verify without coupling the neutral schema to
one token format.

The runtime helper’s focus forwarding works for the initial title target, but the shared host suite
needs an open fixture before it can focus that target. A closed modal does not expose its inner
focusable title. A backdrop is a native pseudo-element, so it cannot be included among queryable
parts in the shared host row. These are fixture differences rather than missing component behavior.

The component uses native modal semantics defined in the
[HTML Standard](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element).
No framework-specific focus trap dependency is needed.

PR review exposed an activation-dependent Chromium behavior missed by the initial cancellation
test. The native cancel event can be noncancelable without recent user activation, and earlier
tests can leave activation behind. The regression fixture now opens in a fresh document, checks
that no activation has occurred, and presses Escape three times for both disabled dismissal and
consumer-prevented cancellation. Escape is handled before its browser default; non-keyboard native
cancel requests still use the same host cancellation path. The creation checklist should require
fresh-document tests when browser behavior depends on user activation or other browsing state.
