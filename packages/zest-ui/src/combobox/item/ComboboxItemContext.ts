'use client';
import * as React from 'react';
import type { ComboboxItemState } from './ComboboxItem';

export interface ComboboxItemContext {
  /**
   * The item's state, so parts inside it can follow the selection without
   * reaching back into the store.
   */
  state: ComboboxItemState;
}

export const ComboboxItemContext = React.createContext<ComboboxItemContext | undefined>(undefined);

export function useComboboxItemContext() {
  const context = React.useContext(ComboboxItemContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ComboboxItemContext is missing. Parts must be placed within <Combobox.Item>.',
    );
  }

  return context;
}
