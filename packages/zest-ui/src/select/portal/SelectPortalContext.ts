'use client';
import * as React from 'react';

export const SelectPortalContext = React.createContext<boolean | undefined>(undefined);

export function useSelectPortalContext() {
  const context = React.useContext(SelectPortalContext);
  if (context === undefined) {
    throw new Error(
      'Zest: SelectPortalContext is missing. <Select.Positioner> must be placed within <Select.Portal>.',
    );
  }

  return context;
}
