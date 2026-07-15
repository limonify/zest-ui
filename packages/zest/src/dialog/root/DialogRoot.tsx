'use client';
import type * as React from 'react';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { useRenderDialogRoot } from './useRenderDialogRoot';

/**
 * Groups all parts of the dialog.
 * Doesn't render its own element.
 */
export function DialogRoot(props: DialogRoot.Props) {
  return useRenderDialogRoot(props, 'dialog');
}

export interface DialogRootState {}

export interface DialogRootProps {
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
   * The content of the dialog.
   */
  children?: React.ReactNode;
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
  export type Props = DialogRootProps;
  export type ChangeEventReason = DialogRootChangeEventReason;
  export type ChangeEventDetails = DialogRootChangeEventDetails;
}
