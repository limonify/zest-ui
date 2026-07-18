'use client';
import * as React from 'react';
import type { MenuRadioItemState } from './MenuRadioItem';

export const MenuRadioItemContext = React.createContext<MenuRadioItemState | undefined>(undefined);

export function useMenuRadioItemContext() {
  const context = React.useContext(MenuRadioItemContext);
  if (context === undefined) {
    throw new Error(
      'Zest: MenuRadioItemContext is missing. Menu.RadioItemIndicator must be placed within <Menu.RadioItem>.',
    );
  }

  return context;
}
