'use client';
import * as React from 'react';
import type { ComboboxItem } from '../store/ComboboxStore';

export interface ComboboxSelectionContext {
  /**
   * The selected value(s), resolved to items. Empty when nothing is selected,
   * and at most one entry unless the combobox is `multiple`.
   */
  selectedItems: ComboboxItem[];
}

/**
 * The selected view of the items, kept apart from the filtered one on purpose.
 *
 * They change for different reasons — filtering on every keystroke, selection on
 * every press — and a single context would mean choosing one row re-rendered
 * `Combobox.List` and with it every row in the list.
 */
export const ComboboxSelectionContext = React.createContext<
  ComboboxSelectionContext | undefined
>(undefined);

export function useComboboxSelectionContext() {
  const context = React.useContext(ComboboxSelectionContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ComboboxSelectionContext is missing. Combobox parts must be placed within <Combobox.Root> or <Autocomplete.Root>.',
    );
  }

  return context;
}
