'use client';
import * as React from 'react';
import type { ZestNativeEvent } from '../../utils/createChangeEventDetails';
import type { MenuStore } from '../store/MenuStore';
import type { MenuRoot } from '../root/MenuRoot';

export interface MenuSubmenuRootContext {
  /**
   * The store of the menu this submenu hangs off. The submenu's own store comes
   * from `MenuRootContext`, which `MenuSubmenuRoot` replaces for its children.
   */
  parentMenu: MenuStore;
  /**
   * Whether closing this submenu with Escape (or the Android back button) also
   * closes its parent.
   */
  closeParentOnEsc: boolean;
  /**
   * Closes every menu above this one, however deeply nested.
   *
   * Pressing an item in a submenu dismisses the whole menu, not just the submenu
   * it sits in. Upstream broadcasts a `close` event across its floating tree;
   * zest has no such tree, so each `SubmenuRoot` closes its own parent and hands
   * off to the one above it. Each menu gets its own event details, so one menu
   * vetoing its close does not silently stop the others.
   */
  closeAncestors: (reason: MenuRoot.ChangeEventReason, event: ZestNativeEvent) => void;
}

export const MenuSubmenuRootContext = React.createContext<MenuSubmenuRootContext | undefined>(
  undefined,
);

/** Optional: a menu that is not a submenu has no parent, which is not an error. */
export function useMenuSubmenuRootContext() {
  return React.useContext(MenuSubmenuRootContext);
}
