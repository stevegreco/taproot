import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Dialog as AriaDialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { useControllableState } from "../internal/form-field";
import "./dialog.css";

/** Content that can be a node, or a function that receives `close` for an uncontrolled dialog. */
export type DialogSlot = ReactNode | ((close: () => void) => ReactNode);

export interface DialogProps {
  /** Whether the dialog is shown (controlled). Pair with `onOpenChange`. */
  open?: boolean;
  /** Whether the dialog starts shown (uncontrolled). */
  defaultOpen?: boolean;
  /** Visible title and accessible name. */
  label: string;
  /** Optional short description, shown under the title and read as the dialog's description. */
  description?: string;
  /** Whether Escape requests dismissal. Default `true`. Clicking the backdrop never closes. */
  dismissible?: boolean;
  /**
   * Called when Escape requests dismissal, with a cancelable `Event`. Call `preventDefault()` to
   * keep the dialog open, for example to protect unfinished work.
   */
  onCancel?: (event: Event) => void;
  /**
   * Called once after the dialog closes, whatever closed it: an action, dismissal, or the parent
   * setting `open` to false.
   */
  onClose?: () => void;
  /**
   * Called with `false` when dismissal was not prevented, or when `close` from a render function
   * runs. A controlled dialog sets `open` here.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The control to focus on opening. Without it the title takes focus, so opening cannot activate
   * a destructive choice.
   */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Task content. */
  children?: DialogSlot;
  /** Actions, including an explicit way to close. Compose them with Button. */
  actions?: DialogSlot;
  /** Added to the root (backdrop) element's classes. */
  className?: string;
}

const render = (slot: DialogSlot, close: () => void) =>
  typeof slot === "function" ? slot(close) : slot;

/** Moves focus to `initialFocus` or the title, unless something inside already took it. */
function InitialFocus({
  dialog,
  title,
  initialFocus,
}: {
  dialog: RefObject<HTMLElement | null>;
  title: RefObject<HTMLHeadingElement | null>;
  initialFocus?: RefObject<HTMLElement | null>;
}) {
  // A child's effect runs before React Aria's dialog effect, which focuses the dialog element
  // itself only when focus is not already inside.
  useEffect(() => {
    // React Aria leaves out aria-modal (it hides the outside instead) and drops the prop, so set it
    // here: the spec asks to expose the modal state.
    dialog.current?.setAttribute("aria-modal", "true");
    if (dialog.current?.contains(document.activeElement)) return;
    (initialFocus?.current ?? title.current)?.focus({ preventScroll: true });
  }, []);
  return null;
}

export function Dialog({
  open,
  defaultOpen = false,
  label,
  description,
  dismissible = true,
  onCancel,
  onClose,
  onOpenChange,
  initialFocus,
  children,
  actions,
  className,
}: DialogProps) {
  useEffect(() => {
    if (!label.trim()) {
      console.warn("Dialog: label is empty. A dialog needs a visible title that names the task.");
    }
  }, [label]);

  const [isOpen, setInternal, isControlled] = useControllableState(open, defaultOpen);

  const requestClose = useCallback(() => {
    if (!isControlled) setInternal(false);
    onOpenChange?.(false);
  }, [isControlled, setInternal, onOpenChange]);

  // React Aria reports Escape (the only close it starts, since the backdrop is not dismissable) as
  // onOpenChange(false). Turn it into a cancelable cancel event first.
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      const event = new Event("cancel", { cancelable: true });
      onCancel?.(event);
      if (!event.defaultPrevented) requestClose();
    },
    [onCancel, requestClose],
  );

  // close-notification: report once for each open-to-closed change, whatever caused it.
  const wasOpen = useRef(isOpen);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    if (wasOpen.current && !isOpen) onCloseRef.current?.();
    wasOpen.current = isOpen;
  }, [isOpen]);

  const dialogRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionId = useId();

  return (
    <AriaModalOverlay
      className={className ? `ds-dialog ${className}` : "ds-dialog"}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      isDismissable={false}
      isKeyboardDismissDisabled={!dismissible}
      data-dismissible={dismissible ? "true" : "false"}
    >
      {/* Not an anatomy part: React Aria's modal element, which holds the Escape handling. */}
      <AriaModal className="ds-dialog__modal">
        <AriaDialog
          ref={dialogRef}
          className="ds-dialog__dialog"
          aria-describedby={description ? descriptionId : undefined}
        >
          <Heading slot="title" ref={titleRef} tabIndex={-1} className="ds-dialog__title">
            {label}
          </Heading>
          {description ? (
            <p id={descriptionId} className="ds-dialog__description">
              {description}
            </p>
          ) : null}
          {children != null ? (
            <div className="ds-dialog__content">{render(children, requestClose)}</div>
          ) : null}
          {actions != null ? (
            <div className="ds-dialog__actions">{render(actions, requestClose)}</div>
          ) : null}
          <InitialFocus dialog={dialogRef} title={titleRef} initialFocus={initialFocus} />
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
}
