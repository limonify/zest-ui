'use client';
import * as React from 'react';
import type { DrawerProviderStore } from './DrawerProviderStore';

export const DrawerProviderContext = React.createContext<DrawerProviderStore | undefined>(
  undefined,
);

/**
 * The provider's store, or `undefined`. A `Drawer.Provider` is optional — a
 * drawer works perfectly well without one, it just has nothing to indent.
 */
export function useDrawerProviderContext() {
  return React.useContext(DrawerProviderContext);
}
