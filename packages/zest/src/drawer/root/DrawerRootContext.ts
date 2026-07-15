'use client';
import * as React from 'react';

export type DrawerSwipeDirection = 'up' | 'down' | 'left' | 'right';

export interface DrawerRootContext {
  /**
   * The direction a swipe must travel to dismiss the drawer.
   */
  swipeDirection: DrawerSwipeDirection;
}

export const DrawerRootContext = React.createContext<DrawerRootContext | undefined>(undefined);

export function useDrawerRootContext() {
  const context = React.useContext(DrawerRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: DrawerRootContext is missing. Drawer parts must be placed within <Drawer.Root>.',
    );
  }

  return context;
}
