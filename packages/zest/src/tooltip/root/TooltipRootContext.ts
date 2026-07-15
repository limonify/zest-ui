'use client';
import * as React from 'react';
import type { TooltipStore } from '../store/TooltipStore';

export const TooltipRootContext = React.createContext<TooltipStore | undefined>(undefined);

export function useTooltipRootContext() {
  const context = React.useContext(TooltipRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: TooltipRootContext is missing. Tooltip parts must be placed within <Tooltip.Root>.',
    );
  }

  return context;
}
