'use client';
import type * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { PopoverStore } from '../store/PopoverStore';
import { PopoverRootContext } from './PopoverRootContext';

/**
 * Groups all parts of the popover.
 * Doesn't render its own element.
 */
export function PopoverRoot(props: PopoverRoot.Props) {
  const {
    children,
    defaultOpen = false,
    disablePointerDismissal = false,
    onOpenChange,
    open,
  } = props;

  const store = useRefWithInit(
    () => new PopoverStore({ open: defaultOpen, openProp: open, disablePointerDismissal }),
  ).current;

  store.useControlledProp('openProp', open);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useSyncedValues({ disablePointerDismissal });

  return <PopoverRootContext.Provider value={store}>{children}</PopoverRootContext.Provider>;
}

export interface PopoverRootState {}

export interface PopoverRootProps {
  /**
   * Whether the popover is currently open.
   */
  open?: boolean | undefined;
  /**
   * Whether the popover is initially open.
   *
   * To render a controlled popover, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the popover is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: PopoverRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether to prevent the popover from closing on presses outside the popup.
   * @default false
   */
  disablePointerDismissal?: boolean | undefined;
  /**
   * The content of the popover.
   */
  children?: React.ReactNode;
}

export type PopoverRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closePress
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type PopoverRootChangeEventDetails = ZestChangeEventDetails<PopoverRootChangeEventReason>;

export namespace PopoverRoot {
  export type State = PopoverRootState;
  export type Props = PopoverRootProps;
  export type ChangeEventReason = PopoverRootChangeEventReason;
  export type ChangeEventDetails = PopoverRootChangeEventDetails;
}
