'use client';
import * as React from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { Align, PhysicalSide } from '../../utils/useAnchorPositioning';

export interface TooltipPositionerContext {
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

export const TooltipPositionerContext = React.createContext<TooltipPositionerContext | undefined>(
  undefined,
);

export function useTooltipPositionerContext() {
  const context = React.useContext(TooltipPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Zest: TooltipPositionerContext is missing. <Tooltip.Popup> must be placed within <Tooltip.Positioner>.',
    );
  }

  return context;
}
