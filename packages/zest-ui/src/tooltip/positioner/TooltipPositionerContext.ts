'use client';
import * as React from 'react';
import type { Align, Side } from '../../utils/useAnchorPositioning';

export interface TooltipPositionerContext {
  side: Side;
  align: Align;
  arrowRef: React.RefObject<unknown>;
  arrowStyles: { left?: number; top?: number };
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
