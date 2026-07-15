'use client';
import * as React from 'react';
import type { DrawerRoot } from './DrawerRoot';

export type DrawerSwipeDirection = 'up' | 'down' | 'left' | 'right';

/**
 * A number `<= 1` is a fraction of the viewport height; anything larger is a
 * pixel value. Upstream also accepts `'148px'`/`'30rem'` strings — see
 * `resolveSnapPointHeight` for why React Native takes numbers only.
 */
export type DrawerSnapPoint = number;

export interface DrawerRootContext {
  /**
   * The direction a swipe must travel to dismiss the drawer.
   */
  swipeDirection: DrawerSwipeDirection;
  /**
   * Snap points used to position the drawer, if any.
   */
  snapPoints: readonly DrawerSnapPoint[] | undefined;
  /**
   * Whether to disable velocity-based snap skipping.
   */
  snapToSequentialPoints: boolean;
  /**
   * The currently active snap point. `undefined` means "the first one";
   * `null` means none.
   */
  activeSnapPoint: DrawerSnapPoint | null | undefined;
  setActiveSnapPoint: (
    snapPoint: DrawerSnapPoint | null,
    eventDetails: DrawerRoot.SnapPointChangeEventDetails,
  ) => void;
  /**
   * The popup's measured height, which every snap point offset is derived from.
   */
  popupHeight: number;
  onPopupHeightChange: (height: number) => void;
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
