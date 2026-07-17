'use client';
import * as React from 'react';
import type { Align, Side } from '../../utils/useAnchorPositioning';

export interface PopoverPositionerContext {
  /**
   * The side the popup was actually placed on, after collision handling.
   */
  side: Side;
  /**
   * The alignment the popup was actually placed with.
   */
  align: Align;
  arrowRef: React.RefObject<unknown>;
  arrowStyles: { left?: number; top?: number };
}

export const PopoverPositionerContext = React.createContext<PopoverPositionerContext | undefined>(
  undefined,
);

export function usePopoverPositionerContext() {
  const context = React.useContext(PopoverPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Zest: PopoverPositionerContext is missing. <Popover.Popup> must be placed within <Popover.Positioner>.',
    );
  }

  return context;
}
