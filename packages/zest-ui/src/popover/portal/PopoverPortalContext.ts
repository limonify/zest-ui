'use client';
import * as React from 'react';

export const PopoverPortalContext = React.createContext<boolean | undefined>(undefined);

export function usePopoverPortalContext() {
  const context = React.useContext(PopoverPortalContext);
  if (context === undefined) {
    throw new Error(
      'Zest: PopoverPortalContext is missing. <Popover.Positioner> must be placed within <Popover.Portal>.',
    );
  }

  return context;
}
