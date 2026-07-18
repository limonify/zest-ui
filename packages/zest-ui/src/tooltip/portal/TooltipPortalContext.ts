'use client';
import * as React from 'react';

export const TooltipPortalContext = React.createContext<boolean | undefined>(undefined);

export function useTooltipPortalContext() {
  const context = React.useContext(TooltipPortalContext);
  if (context === undefined) {
    throw new Error(
      'Zest: TooltipPortalContext is missing. <Tooltip.Positioner> must be placed within <Tooltip.Portal>.',
    );
  }

  return context;
}
