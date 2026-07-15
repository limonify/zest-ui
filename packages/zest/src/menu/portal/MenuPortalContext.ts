'use client';
import * as React from 'react';

export const MenuPortalContext = React.createContext<boolean | undefined>(undefined);

export function useMenuPortalContext() {
  const context = React.useContext(MenuPortalContext);
  if (context === undefined) {
    throw new Error(
      'Zest: MenuPortalContext is missing. <Menu.Positioner> must be placed within <Menu.Portal>.',
    );
  }

  return context;
}
