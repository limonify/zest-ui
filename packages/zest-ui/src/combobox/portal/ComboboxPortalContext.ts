'use client';
import * as React from 'react';

export const ComboboxPortalContext = React.createContext<boolean | undefined>(undefined);

export function useComboboxPortalContext() {
  const context = React.useContext(ComboboxPortalContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ComboboxPortalContext is missing. <Combobox.Positioner> must be placed within <Combobox.Portal>.',
    );
  }

  return context;
}
