'use client';
import type * as React from 'react';
import type { DialogRoot } from '../../dialog/root/DialogRoot';
import { useRenderDialogRoot } from '../../dialog/root/useRenderDialogRoot';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';

/**
 * Groups all parts of the alert dialog.
 * Doesn't render its own element.
 *
 * An alert dialog interrupts the user and must be dismissed deliberately: it
 * never closes on an outside press, so it takes no `disablePointerDismissal`.
 */
export function AlertDialogRoot(props: AlertDialogRoot.Props) {
  return useRenderDialogRoot(props, 'alert-dialog');
}

export interface AlertDialogRootState {}

export interface AlertDialogRootProps
  extends Omit<DialogRoot.Props, 'disablePointerDismissal' | 'onOpenChange'> {
  /**
   * Event handler called when the alert dialog is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: AlertDialogRoot.ChangeEventDetails) => void)
    | undefined;
}

export type AlertDialogRootChangeEventReason = DialogRoot.ChangeEventReason;

export type AlertDialogRootChangeEventDetails =
  ZestChangeEventDetails<AlertDialogRootChangeEventReason>;

export namespace AlertDialogRoot {
  export type State = AlertDialogRootState;
  export type Props = AlertDialogRootProps;
  export type ChangeEventReason = AlertDialogRootChangeEventReason;
  export type ChangeEventDetails = AlertDialogRootChangeEventDetails;
}
