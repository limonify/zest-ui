'use client';
import * as React from 'react';
import type { ZestNativeEvent } from '../../utils/createChangeEventDetails';
import { ComboboxRootContext, type ComboboxItem } from './ComboboxRootContext';
import { useComboboxRoot, type ComboboxItems } from './useComboboxRoot';

/**
 * Groups all parts of the combobox: a text input that filters a list of items,
 * one of which is selected.
 * Doesn't render its own element.
 *
 * **Adapted from upstream.** Base UI's Combobox is a large component built on a
 * shared collection/filter core with chips, groups, rows and virtualization.
 * This is a focused React Native port: an input, a filtered list, and single
 * selection. Filtering is a case-insensitive label match by default; pass
 * `filter` to change it.
 */
export function ComboboxRoot(props: ComboboxRoot.Props) {
  const {
    items,
    value,
    defaultValue,
    onValueChange,
    inputValue,
    defaultInputValue,
    onInputValueChange,
    open,
    defaultOpen,
    onOpenChange,
    openOnFocus,
    filter,
    disabled = false,
    children,
  } = props;

  const contextValue = useComboboxRoot({
    mode: 'combobox',
    items,
    value,
    defaultValue,
    onValueChange,
    inputValue,
    defaultInputValue,
    onInputValueChange,
    open,
    defaultOpen,
    onOpenChange,
    openOnFocus,
    filter,
    disabled,
  });

  return <ComboboxRootContext.Provider value={contextValue}>{children}</ComboboxRootContext.Provider>;
}

export interface ComboboxRootState {}

export interface ComboboxRootProps {
  /**
   * The items to filter and choose from. Strings, or `{ value, label }` records
   * for non-string values.
   */
  items?: ComboboxItems | undefined;
  /**
   * The selected value.
   */
  value?: unknown;
  /**
   * The initially selected value when uncontrolled.
   */
  defaultValue?: unknown;
  /**
   * Called when the selection changes.
   */
  onValueChange?: ((value: unknown) => void) | undefined;
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
   * Whether the list is open.
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
   * Whether focusing the input opens the list.
   * @default true
   */
  openOnFocus?: boolean | undefined;
  /**
   * A custom filter predicate. Defaults to a case-insensitive label match.
   */
  filter?: ((item: ComboboxItem, query: string) => boolean) | undefined;
  /**
   * Whether the combobox is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  children?: React.ReactNode;
}

export namespace ComboboxRoot {
  export type State = ComboboxRootState;
  export type Props = ComboboxRootProps;
}
