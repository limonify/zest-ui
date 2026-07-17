'use client';
import type * as React from 'react';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import type { DialogHandle } from '../store/DialogHandle';
import { useRenderDialogRoot } from './useRenderDialogRoot';

/**
 * Groups all parts of the dialog.
 * Doesn't render its own element.
 */
export function DialogRoot<Payload = unknown>(props: DialogRoot.Props<Payload>) {
  return useRenderDialogRoot(props, 'dialog');
}

export interface DialogRootState {}

export interface DialogRootActions {
  /**
   * Unmounts the dialog without firing `onOpenChange`. Call it after an
   * externally controlled closing animation finishes.
   */
  unmount: () => void;
  /**
   * Closes the dialog, reporting the `imperative-action` reason.
   */
  close: () => void;
}

export interface DialogRootProps<Payload = unknown> {
  /**
   * Whether the dialog is currently open.
   */
  open?: boolean | undefined;
  /**
   * Whether the dialog is initially open.
   *
   * To render a controlled dialog, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the dialog is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: DialogRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether to prevent the dialog from closing on presses outside the popup.
   * @default false
   */
  disablePointerDismissal?: boolean | undefined;
  /**
   * A ref to imperative actions.
   */
  actionsRef?: React.RefObject<DialogRoot.Actions | null> | undefined;
  /**
   * A handle associating this dialog with triggers rendered outside it, and
   * letting it be opened and closed imperatively. Create one with
   * `Dialog.createHandle()`.
   */
  handle?: DialogHandle<Payload> | undefined;
  /**
   * The id of the trigger the dialog is associated with. Useful together with
   * the `open` prop, to control which trigger a controlled dialog belongs to.
   */
  triggerId?: string | null | undefined;
  /**
   * The id of the trigger the dialog is initially associated with. Useful
   * together with `defaultOpen`.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * The content of the dialog.
   *
   * Pass a function to receive the payload the dialog was opened with, via the
   * handle's `openWithPayload()` or a trigger's `payload` prop.
   */
  children?: React.ReactNode | ((payload: Payload) => React.ReactNode);
}

export type DialogRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closePress
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type DialogRootChangeEventDetails = ZestChangeEventDetails<DialogRootChangeEventReason>;

export namespace DialogRoot {
  export type State = DialogRootState;
  export type Props<Payload = unknown> = DialogRootProps<Payload>;
  export type Actions = DialogRootActions;
  export type ChangeEventReason = DialogRootChangeEventReason;
  export type ChangeEventDetails = DialogRootChangeEventDetails;
}
