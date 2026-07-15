'use client';
import type * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { MenuStore } from '../store/MenuStore';
import { MenuRootContext } from './MenuRootContext';

/**
 * Groups all parts of the menu.
 * Doesn't render its own element.
 *
 * Submenus (`SubmenuRoot`/`SubmenuTrigger`) and the checkbox/radio item family
 * are not ported yet.
 */
export function MenuRoot(props: MenuRoot.Props) {
  const {
    children,
    defaultOpen = false,
    disablePointerDismissal = false,
    onOpenChange,
    open,
  } = props;

  const store = useRefWithInit(
    () => new MenuStore({ open: defaultOpen, openProp: open, disablePointerDismissal }),
  ).current;

  store.useControlledProp('openProp', open);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useSyncedValues({ disablePointerDismissal });

  return <MenuRootContext.Provider value={store}>{children}</MenuRootContext.Provider>;
}

export interface MenuRootState {}

export interface MenuRootProps {
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
   * The content of the menu.
   */
  children?: React.ReactNode;
}

export type MenuRootChangeEventReason =
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.itemPress
  | typeof REASONS.closePress
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type MenuRootChangeEventDetails = ZestChangeEventDetails<MenuRootChangeEventReason>;

export namespace MenuRoot {
  export type State = MenuRootState;
  export type Props = MenuRootProps;
  export type ChangeEventReason = MenuRootChangeEventReason;
  export type ChangeEventDetails = MenuRootChangeEventDetails;
}
