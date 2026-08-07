'use client';
import * as React from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { Align, PhysicalSide } from '../../utils/useAnchorPositioning';

export interface MenuPositionerContext {
  side: PhysicalSide;
  align: Align;
  arrowRef: React.RefObject<unknown>;
  arrowStyles: { left?: number; top?: number };
  /**
   * Spread onto the `Arrow` part so its position is recomputed once it has been
   * measured — see `useAnchorPositioning`.
   */
  onArrowLayout: (event: LayoutChangeEvent) => void;
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
