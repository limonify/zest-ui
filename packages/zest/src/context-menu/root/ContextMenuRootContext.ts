'use client';
import * as React from 'react';

export interface ContextMenuAnchorPoint {
  x: number;
  y: number;
}

export interface ContextMenuRootContext {
  /**
   * The screen point the menu is anchored to — where the long press landed.
   */
  anchor: ContextMenuAnchorPoint;
  setAnchor: (point: ContextMenuAnchorPoint) => void;
}

export const ContextMenuRootContext = React.createContext<ContextMenuRootContext | undefined>(
  undefined,
);

export function useContextMenuRootContext() {
  const context = React.useContext(ContextMenuRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ContextMenuRootContext is missing. ContextMenu parts must be placed within <ContextMenu.Root>.',
    );
  }

  return context;
}
