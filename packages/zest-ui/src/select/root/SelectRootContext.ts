'use client';
import * as React from 'react';
import type { SelectStore } from '../store/SelectStore';

export const SelectRootContext = React.createContext<SelectStore | undefined>(undefined);

export function useSelectRootContext() {
  const context = React.useContext(SelectRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: SelectRootContext is missing. Select parts must be placed within <Select.Root>.',
    );
  }

  return context;
}
