'use client';
import * as React from 'react';
import type { Align, Side } from '../../utils/useAnchorPositioning';

export interface MenuPositionerContext {
  side: Side;
  align: Align;
  arrowRef: React.RefObject<unknown>;
  arrowStyles: { left?: number; top?: number };
}

export const MenuPositionerContext = React.createContext<MenuPositionerContext | undefined>(
  undefined,
);

export function useMenuPositionerContext() {
  const context = React.useContext(MenuPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Zest: MenuPositionerContext is missing. <Menu.Popup> must be placed within <Menu.Positioner>.',
    );
  }

  return context;
}
