'use client';
import * as React from 'react';
import type { ZestNativeEvent } from '../../utils/createChangeEventDetails';
import {
  ComboboxRootContext,
  type ComboboxItem,
} from '../../combobox/root/ComboboxRootContext';
import { useComboboxRoot, type ComboboxItems } from '../../combobox/root/useComboboxRoot';

/**
 * Groups all parts of the autocomplete: a free-text input with a list of
 * suggestions.
 * Doesn't render its own element.
 *
 * An autocomplete is a combobox whose value *is* the typed text — choosing a
 * suggestion fills the input rather than selecting a separate value. It reuses
 * every combobox part.
 */
export function AutocompleteRoot(props: AutocompleteRoot.Props) {
  const {
    items,
    inputValue,
    defaultInputValue,
    onInputValueChange,
    open,
    defaultOpen,
    onOpenChange,
    filter,
    disabled = false,
    children,
  } = props;

  const contextValue = useComboboxRoot({
    mode: 'autocomplete',
    items,
    inputValue,
    defaultInputValue,
    onInputValueChange,
    open,
    defaultOpen,
    onOpenChange,
    filter,
    disabled,
  });

  return (
    <ComboboxRootContext.Provider value={contextValue}>{children}</ComboboxRootContext.Provider>
  );
}

export interface AutocompleteRootState {}

export interface AutocompleteRootProps {
  /**
   * The suggestions. Strings, or `{ value, label }` records.
   */
  items?: ComboboxItems | undefined;
  /**
   * The controlled input text.
   */
  inputValue?: string | undefined;
  /**
   * The initial input text when uncontrolled.
   */
  defaultInputValue?: string | undefined;
  /**
   * Called as the input text changes.
   */
  onInputValueChange?: ((value: string) => void) | undefined;
  /**
   * Whether the suggestion list is open.
   */
  open?: boolean | undefined;
  /**
   * Whether the list is initially open when uncontrolled.
   */
  defaultOpen?: boolean | undefined;
  /**
   * Called when the list opens or closes.
   */
  onOpenChange?: ((open: boolean, event?: ZestNativeEvent) => void) | undefined;
  /**
   * A custom filter predicate. Defaults to a case-insensitive label match.
   */
  filter?: ((item: ComboboxItem, query: string) => boolean) | undefined;
  /**
   * Whether the autocomplete is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  children?: React.ReactNode;
}

export namespace AutocompleteRoot {
  export type State = AutocompleteRootState;
  export type Props = AutocompleteRootProps;
}
