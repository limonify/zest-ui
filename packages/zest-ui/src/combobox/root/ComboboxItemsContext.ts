'use client';
import * as React from 'react';
import type { ComboboxEntry } from '../store/ComboboxStore';

export interface ComboboxItemsContext {
  /**
   * The entries left after filtering by the current query — items, groups, or
   * both, matching the shape of the `items` prop.
   */
  filteredItems: ComboboxEntry[];
  /**
   * How many selectable items survived filtering, with groups flattened away.
   */
  filteredItemCount: number;
}

/**
 * The filtered and the selected views of the items.
 *
 * Both are derived from the store rather than stored in it: a synced store value
 * only lands in a layout effect, which would leave the list one commit behind
 * the text the user just typed. Deriving them once in the root also keeps
 * `Value`, `Chips`, `Chip` and `Clear` from each repeating the same resolution.
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
