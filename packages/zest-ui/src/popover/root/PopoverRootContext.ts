'use client';
import * as React from 'react';
import type { PopoverStore } from '../store/PopoverStore';

export const PopoverRootContext = React.createContext<PopoverStore | undefined>(undefined);

export function usePopoverRootContext() {
  const context = React.useContext(PopoverRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: PopoverRootContext is missing. Popover parts must be placed within <Popover.Root>.',
    );
  }

  return context;
}
