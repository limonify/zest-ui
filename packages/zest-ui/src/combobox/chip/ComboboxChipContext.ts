'use client';
import * as React from 'react';
import type { ComboboxItem } from '../store/ComboboxStore';

export interface ComboboxChipContext {
  /**
   * The chip's index in the selection, which is what `Combobox.ChipRemove`
   * removes.
   */
  index: number;
  /**
   * The selected item this chip stands for, if the selection reaches that far.
   */
  item: ComboboxItem | undefined;
}

export const ComboboxChipContext = React.createContext<ComboboxChipContext | undefined>(undefined);

export function useComboboxChipContext() {
  const context = React.useContext(ComboboxChipContext);
  if (context === undefined) {
    throw new Error('Zest: ComboboxChipContext is missing. Parts must be placed within <Combobox.Chip>.');
  }

  return context;
}
