'use client';
import * as React from 'react';
import { MenuRoot } from '../root/MenuRoot';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useStableCallback } from '../../hooks/useStableCallback';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { ZestNativeEvent } from '../../utils/createChangeEventDetails';
import { MenuSubmenuRootContext, useMenuSubmenuRootContext } from './MenuSubmenuRootContext';

/**
 * Groups all parts of a submenu.
 * Doesn't render its own element.
 *
 * A submenu is an ordinary `Menu.Root` that remembers its parent, so its Portal
 * is a `Modal` nested inside the parent's — which React Native supports, and
 * which keeps the whole menu tree in one React tree.
 *
 * **Not ported from upstream.** `openOnHover` and its delays: there is no hover
 * on a touch screen, so a submenu opens when its trigger is pressed.
 */
export function MenuSubmenuRoot(props: MenuSubmenuRoot.Props) {
  const { closeParentOnEsc = false, ...menuProps } = props;

  // Inside this component the "root" context is still the parent's — `MenuRoot`
  // below has not replaced it yet — and the submenu context is the parent's own,
  // which is what makes the ancestor chain walkable.
  const parentMenu = useMenuRootContext();
  const grandparentContext = useMenuSubmenuRootContext();

  const closeAncestors = useStableCallback(
    (reason: MenuSubmenuRoot.ChangeEventReason, event: ZestNativeEvent) => {
      parentMenu.setOpen(false, createChangeEventDetails(reason, event));
      grandparentContext?.closeAncestors(reason, event);
    },
  );

  const contextValue: MenuSubmenuRootContext = React.useMemo(
    () => ({ parentMenu, closeParentOnEsc, closeAncestors }),
    [parentMenu, closeParentOnEsc, closeAncestors],
  );

  return (
    <MenuSubmenuRootContext.Provider value={contextValue}>
      <MenuRoot {...menuProps} />
    </MenuSubmenuRootContext.Provider>
  );
}

export interface MenuSubmenuRootState {}

export interface MenuSubmenuRootProps extends MenuRoot.Props {
  /**
   * Whether closing this submenu with the Escape key (or the Android back
   * button) also closes the menu it belongs to.
   * @default false
   */
  closeParentOnEsc?: boolean | undefined;
}

export namespace MenuSubmenuRoot {
  export type State = MenuSubmenuRootState;
  export type Props = MenuSubmenuRootProps;
  export type ChangeEventReason = MenuRoot.ChangeEventReason;
  export type ChangeEventDetails = MenuRoot.ChangeEventDetails;
}
