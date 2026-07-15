'use client';
import * as React from 'react';
import type { MenuCheckboxItemState } from './MenuCheckboxItem';

export const MenuCheckboxItemContext = React.createContext<MenuCheckboxItemState | undefined>(
  undefined,
);

export function useMenuCheckboxItemContext() {
  const context = React.useContext(MenuCheckboxItemContext);
  if (context === undefined) {
    throw new Error(
      'Zest: MenuCheckboxItemContext is missing. Menu.CheckboxItemIndicator must be placed within <Menu.CheckboxItem>.',
    );
  }

  return context;
}
