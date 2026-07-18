'use client';
import * as React from 'react';

export interface MenuGroupContext {
  /**
   * The id the group is labelled by; `Menu.GroupLabel` renders it.
   */
  labelId: string | undefined;
}

export const MenuGroupContext = React.createContext<MenuGroupContext | undefined>(undefined);

export function useMenuGroupContext() {
  const context = React.useContext(MenuGroupContext);
  if (context === undefined) {
    throw new Error(
      'Zest: MenuGroupContext is missing. <Menu.GroupLabel> must be placed within <Menu.Group>.',
    );
  }

  return context;
}
