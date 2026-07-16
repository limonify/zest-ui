'use client';
import * as React from 'react';
import type { ZestNativeEvent } from '../../utils/createChangeEventDetails';

export interface ComboboxItem {
  value: unknown;
  label: string;
}

export interface ComboboxRootContext {
  /**
   * `'combobox'` selects a value and shows its label; `'autocomplete'` is free
   * text with suggestions, where the typed string is the value.
   */
  mode: 'combobox' | 'autocomplete';
  open: boolean;
  setOpen: (open: boolean, event?: ZestNativeEvent) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  /**
   * The selected value (combobox mode only). `null` when nothing is selected.
   */
  selectedValue: unknown;
  /**
   * Selects an item: records the value, fills the input with its label, and
   * closes the popup.
   */
  selectItem: (item: ComboboxItem, event?: ZestNativeEvent) => void;
  /**
   * The items after filtering by the current input value.
   */
  filteredItems: ComboboxItem[];
  disabled: boolean;
  /**
   * Whether focusing the input opens the list.
   */
  openOnFocus: boolean;
  /**
   * The anchor's native node, carried across the portal boundary.
   */
  triggerNode: unknown;
  setTriggerNode: (node: unknown) => void;
  update: (() => void) | undefined;
  setUpdate: (fn: (() => void) | undefined) => void;
}

export const ComboboxRootContext = React.createContext<ComboboxRootContext | undefined>(undefined);

export function useComboboxRootContext() {
  const context = React.useContext(ComboboxRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ComboboxRootContext is missing. Combobox parts must be placed within <Combobox.Root> or <Autocomplete.Root>.',
    );
  }

  return context;
}
