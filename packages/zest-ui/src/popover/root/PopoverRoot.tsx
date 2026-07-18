'use client';
import type * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { usePopupRootHandle } from '../../utils/popups/usePopupRootHandle';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { PopoverStore } from '../store/PopoverStore';
import type { PopoverHandle } from '../store/PopoverHandle';
import { PopoverRootContext } from './PopoverRootContext';

/**
 * Groups all parts of the popover.
 * Doesn't render its own element.
 */
export function PopoverRoot<Payload = unknown>(props: PopoverRoot.Props<Payload>) {
  const {
    actionsRef,
    children,
    defaultOpen = false,
    defaultTriggerId = null,
    disablePointerDismissal = false,
    handle,
    onOpenChange,
    open,
    triggerId,
  } = props;

  const store = useRefWithInit(
    () =>
      new PopoverStore({
        open: defaultOpen,
        openProp: open,
        triggerId: defaultTriggerId,
        triggerIdProp: triggerId,
        disablePointerDismissal,
      }),
  ).current;

  store.useControlledProp('openProp', open);
  store.useControlledProp('triggerIdProp', triggerId);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useSyncedValues({ disablePointerDismissal });

  usePopupRootHandle({ store, handle, actionsRef });

  const payload = store.useState('payload') as Payload;

  return (
    <PopoverRootContext.Provider value={store}>
      {typeof children === 'function' ? children(payload) : children}
    </PopoverRootContext.Provider>
  );
}

export interface PopoverRootState {}

export interface PopoverRootActions {
  /**
   * Unmounts the popover without firing `onOpenChange`. Call it after an externally
   * controlled closing animation finishes.
   */
  unmount: () => void;
  /**
   * Closes the popover, reporting the `imperative-action` reason.
   */
  close: () => void;
}

export interface PopoverRootProps<Payload = unknown> {
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
   * A ref to imperative actions.
   */
  actionsRef?: React.RefObject<PopoverRoot.Actions | null> | undefined;
  /**
   * A handle associating this popover with triggers rendered outside it, and letting
   * it be opened and closed imperatively. Create one with `Popover.createHandle()`.
   */
  handle?: PopoverHandle<Payload> | undefined;
  /**
   * The id of the trigger the popover is anchored to and associated with.
   */
  triggerId?: string | null | undefined;
  /**
   * The id of the trigger the popover is initially associated with.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * The content of the popover.
   *
   * Pass a function to receive the payload the popover was opened with.
   */
  children?: React.ReactNode | ((payload: Payload) => React.ReactNode);
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
  export type Props<Payload = unknown> = PopoverRootProps<Payload>;
  export type Actions = PopoverRootActions;
  export type ChangeEventReason = PopoverRootChangeEventReason;
  export type ChangeEventDetails = PopoverRootChangeEventDetails;
}
