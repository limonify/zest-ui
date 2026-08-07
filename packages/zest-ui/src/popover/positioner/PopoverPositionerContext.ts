'use client';
import * as React from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { Align, PhysicalSide } from '../../utils/useAnchorPositioning';

export interface PopoverPositionerContext {
  /**
   * The side the popup was actually placed on, after collision handling.
   */
  side: PhysicalSide;
  /**
   * The alignment the popup was actually placed with.
   */
  align: Align;
  arrowRef: React.RefObject<unknown>;
  arrowStyles: { left?: number; top?: number };
  /**
   * Spread onto the `Arrow` part so its position is recomputed once it has been
   * measured — see `useAnchorPositioning`.
   */
  onArrowLayout: (event: LayoutChangeEvent) => void;
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
