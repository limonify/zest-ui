'use client';
import * as React from 'react';
import type { ComboboxItem } from '../store/ComboboxStore';

export interface ComboboxItemsContext {
  /**
   * The items left after filtering by the current query.
   */
  filteredItems: ComboboxItem[];
}

/**
 * The filtered view of the items.
 *
 * This is derived from the store rather than stored in it: a synced store value
 * only lands in a layout effect, which would leave the list one commit behind
 * the text the user just typed.
 */
export const ComboboxItemsContext = React.createContext<ComboboxItemsContext | undefined>(
  undefined,
);

export function useComboboxItemsContext() {
  const context = React.useContext(ComboboxItemsContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ComboboxItemsContext is missing. Combobox parts must be placed within <Combobox.Root> or <Autocomplete.Root>.',
    );
  }

  return context;
}
