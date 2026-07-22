'use client';
import * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { usePopupRootHandle } from '../../utils/popups/usePopupRootHandle';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { MenuStore } from '../store/MenuStore';
import type { MenuHandle } from '../store/MenuHandle';
import { MenuRootContext } from './MenuRootContext';
import { MenuTransitionContext } from './MenuTransitionContext';

/**
 * Groups all parts of the menu.
 * Doesn't render its own element.
 *
 * **Not ported from upstream.** `Menu.Viewport`, which exists only to animate a
 * content swap when one popup is opened by several triggers: it works by
 * capturing the previous content's DOM node and keeping it on screen while a CSS
 * transition runs, and a rendered React Native node cannot be retained that way
 * once its element is gone.
 */
export function MenuRoot<Payload = unknown>(props: MenuRoot.Props<Payload>) {
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
      new MenuStore({
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

  const resolvedOpen = store.useState('open');
  const { transitionStatus } = useTransitionStatus(resolvedOpen, false, true);

  const payload = store.useState('payload') as Payload;

  const transitionContextValue = React.useMemo(
    () => ({ transitionStatus }),
    [transitionStatus],
  );

  return (
    <MenuRootContext.Provider value={store}>
      <MenuTransitionContext.Provider value={transitionContextValue}>
        {typeof children === 'function' ? children(payload) : children}
      </MenuTransitionContext.Provider>
    </MenuRootContext.Provider>
  );
}

export interface MenuRootState {}

export interface MenuRootActions {
  /**
   * Unmounts the menu without firing `onOpenChange`. Call it after an externally
   * controlled closing animation finishes.
   */
  unmount: () => void;
  /**
   * Closes the menu, reporting the `imperative-action` reason.
   */
  close: () => void;
}

export interface MenuRootProps<Payload = unknown> {
  /**
   * Whether the menu is currently open.
   */
  open?: boolean | undefined;
  /**
   * Whether the menu is initially open.
   *
   * To render a controlled menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange?: ((open: boolean, eventDetails: MenuRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Whether to prevent the menu from closing on presses outside the popup.
   * @default false
   */
  disablePointerDismissal?: boolean | undefined;
  /**
   * A ref to imperative actions.
   */
  actionsRef?: React.RefObject<MenuRoot.Actions | null> | undefined;
  /**
   * A handle associating this menu with triggers rendered outside it, and letting
   * it be opened and closed imperatively. Create one with `Menu.createHandle()`.
   */
  handle?: MenuHandle<Payload> | undefined;
  /**
   * The id of the trigger the menu is anchored to and associated with.
   */
  triggerId?: string | null | undefined;
  /**
   * The id of the trigger the menu is initially associated with.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * The content of the menu.
   *
   * Pass a function to receive the payload the menu was opened with.
   */
  children?: React.ReactNode | ((payload: Payload) => React.ReactNode);
}

export type MenuRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.itemPress
  | typeof REASONS.linkPress
  | typeof REASONS.closePress
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type MenuRootChangeEventDetails = ZestChangeEventDetails<MenuRootChangeEventReason>;

export namespace MenuRoot {
  export type State = MenuRootState;
  export type Props<Payload = unknown> = MenuRootProps<Payload>;
  export type Actions = MenuRootActions;
  export type ChangeEventReason = MenuRootChangeEventReason;
  export type ChangeEventDetails = MenuRootChangeEventDetails;
}
