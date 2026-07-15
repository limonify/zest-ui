'use client';
import type * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { TooltipStore } from '../store/TooltipStore';
import { TooltipRootContext } from './TooltipRootContext';

/**
 * Groups all parts of the tooltip.
 * Doesn't render its own element.
 *
 * **Diverges from the web deliberately.** Upstream opens tooltips on hover and
 * focus, with open/close delays — a touch screen has neither hover nor a focus
 * ring, so on React Native a tooltip opens on press (or long press, via
 * `Tooltip.Trigger`'s `longPress` prop) and closes on an outside press. The
 * `delay`/`closeDelay`/`hoverable` props therefore don't exist here.
 */
export function TooltipRoot(props: TooltipRoot.Props) {
  const { children, defaultOpen = false, onOpenChange, open } = props;

  const store = useRefWithInit(
    () => new TooltipStore({ open: defaultOpen, openProp: open }),
  ).current;

  store.useControlledProp('openProp', open);
  store.useContextCallback('onOpenChange', onOpenChange);

  return <TooltipRootContext.Provider value={store}>{children}</TooltipRootContext.Provider>;
}

export interface TooltipRootState {}

export interface TooltipRootProps {
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
   * The content of the tooltip.
   */
  children?: React.ReactNode;
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
  export type Props = TooltipRootProps;
  export type ChangeEventReason = TooltipRootChangeEventReason;
  export type ChangeEventDetails = TooltipRootChangeEventDetails;
}
