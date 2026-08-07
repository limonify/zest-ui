'use client';
import * as React from 'react';
import type { ComboboxItem } from '../store/ComboboxStore';

export interface ComboboxGroupContext {
  /**
   * The id of this group's `Combobox.GroupLabel`, which labels the group.
   */
  labelId: string | undefined;
  /**
   * The group's items, already filtered. `Combobox.Collection` renders these
   * instead of the whole list when it is inside a group.
   */
  items: ComboboxItem[] | undefined;
}

export const ComboboxGroupContext = React.createContext<ComboboxGroupContext | undefined>(
  undefined,
);

export function useComboboxGroupContext() {
  const context = React.useContext(ComboboxGroupContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ComboboxGroupContext is missing. Parts must be placed within <Combobox.Group>.',
    );
  }

  return context;
}

/**
 * The optional form, for `Combobox.Collection` — it falls back to the whole
 * filtered list when it is not inside a group.
 */
export function useOptionalComboboxGroupContext() {
  return React.useContext(ComboboxGroupContext);
}
