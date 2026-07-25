'use client';
import * as React from 'react';
import type { ComboboxStore } from '../store/ComboboxStore';

export type { ComboboxItem, ComboboxItems } from '../store/ComboboxStore';

export const ComboboxRootContext = React.createContext<ComboboxStore | undefined>(undefined);

export function useComboboxRootContext() {
  const context = React.useContext(ComboboxRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ComboboxRootContext is missing. Combobox parts must be placed within <Combobox.Root> or <Autocomplete.Root>.',
    );
  }

  return context;
}
