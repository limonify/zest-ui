'use client';
import * as React from 'react';
import type { MenuStore } from '../store/MenuStore';

export const MenuRootContext = React.createContext<MenuStore | undefined>(undefined);

export function useMenuRootContext() {
  const context = React.useContext(MenuRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: MenuRootContext is missing. Menu parts must be placed within <Menu.Root>.',
    );
  }

  return context;
}
