'use client';
import * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { usePopupRootHandle } from '../../utils/popups/usePopupRootHandle';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { TooltipStore } from '../store/TooltipStore';
import type { TooltipHandle } from '../store/TooltipHandle';
import { TooltipRootContext } from './TooltipRootContext';
import { TooltipTransitionContext } from './TooltipTransitionContext';
import {
  useContextCallback,
  useControlledProp,
  useStoreState,
  useSyncedValues,
} from '../../store/ReactStore';

/**
 * Groups all parts of the tooltip.
 * Doesn't render its own element.
 *
 * **Diverges from the web deliberately.** Upstream opens tooltips on hover and
 * focus, with open/close delays — a touch screen has neither hover nor a focus
 * ring, so on React Native a tooltip opens on press (or long press, via
 * `Tooltip.Trigger`'s `longPress` prop) and closes on an outside press. The
 * `delay`/`closeDelay`/`hoverable`/`trackCursorAxis` props therefore don't exist
 * here: there is no hover intent to wait out.
 */
export function TooltipRoot<Payload = unknown>(props: TooltipRoot.Props<Payload>) {
  const {
    actionsRef,
    children,
    defaultOpen = false,
    defaultTriggerId = null,
    disabled = false,
    disablePointerDismissal = false,
    handle,
    onOpenChange,
    open,
    triggerId,
  } = props;

  const store = useRefWithInit(
    () =>
      new TooltipStore({
        open: defaultOpen,
        openProp: open,
        disabled,
        disablePointerDismissal,
        triggerId: defaultTriggerId,
        triggerIdProp: triggerId,
      }),
  ).current;

  useControlledProp(store, 'openProp', open);
  useControlledProp(store, 'triggerIdProp', triggerId);
  useContextCallback(store, 'onOpenChange', onOpenChange);
  useSyncedValues(store, { disabled, disablePointerDismissal });

  usePopupRootHandle({ store, handle, actionsRef });

  const resolvedOpen = useStoreState(store, 'open');
  const { transitionStatus } = useTransitionStatus(resolvedOpen, false, true);

  const payload = useStoreState(store, 'payload') as Payload;

  const transitionContextValue = React.useMemo(
    () => ({ transitionStatus }),
    [transitionStatus],
  );

  return (
    <TooltipRootContext.Provider value={store}>
      <TooltipTransitionContext.Provider value={transitionContextValue}>
        {typeof children === 'function' ? children(payload) : children}
      </TooltipTransitionContext.Provider>
    </TooltipRootContext.Provider>
  );
}

export interface TooltipRootState {}

export interface TooltipRootActions {
  /**
   * Unmounts the tooltip without firing `onOpenChange`. Call it after an
   * externally controlled closing animation finishes.
   */
  unmount: () => void;
  /**
   * Closes the tooltip, reporting the `imperative-action` reason.
   */
  close: () => void;
}

export interface TooltipRootProps<Payload = unknown> {
  /**
   * Whether the tooltip is currently open.
   */
  open?: boolean | undefined;
  /**
   * Whether the tooltip is initially open.
   *
   * To render a controlled tooltip, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the tooltip is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: TooltipRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the component should ignore user interaction.
   *
   * A disabled tooltip cannot be opened by a press or through its handle.
   * Closing is always allowed, so disabling one that is already open puts it
   * away.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether to prevent the tooltip from closing on presses outside the popup.
   * @default false
   */
  disablePointerDismissal?: boolean | undefined;
  /**
   * A ref to imperative actions.
   */
  actionsRef?: React.RefObject<TooltipRoot.Actions | null> | undefined;
  /**
   * A handle associating this tooltip with triggers rendered outside it, and
   * letting it be opened and closed imperatively. Create one with
   * `Tooltip.createHandle()`.
   */
  handle?: TooltipHandle<Payload> | undefined;
  /**
   * The id of the trigger the tooltip is anchored to and associated with.
   */
  triggerId?: string | null | undefined;
  /**
   * The id of the trigger the tooltip is initially associated with.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * The content of the tooltip.
   *
   * Pass a function to receive the payload the tooltip was opened with.
   */
  children?: React.ReactNode | ((payload: Payload) => React.ReactNode);
}

export type TooltipRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type TooltipRootChangeEventDetails = ZestChangeEventDetails<TooltipRootChangeEventReason>;

export namespace TooltipRoot {
  export type State = TooltipRootState;
  export type Props<Payload = unknown> = TooltipRootProps<Payload>;
  export type Actions = TooltipRootActions;
  export type ChangeEventReason = TooltipRootChangeEventReason;
  export type ChangeEventDetails = TooltipRootChangeEventDetails;
}
