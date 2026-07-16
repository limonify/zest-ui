'use client';
import * as React from 'react';
import { useControlled } from '../../hooks/useControlled';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useStableCallback } from '../../hooks/useStableCallback';
import type { ZestNativeEvent } from '../../utils/createChangeEventDetails';
import { ComboboxRootContext, type ComboboxItem } from './ComboboxRootContext';

export type ComboboxItems = ReadonlyArray<string | { value: unknown; label: string }>;

/** Normalizes the `items` prop into `{ value, label }` records. */
function normalizeItems(items: ComboboxItems | undefined): ComboboxItem[] {
  if (!items) {
    return [];
  }
  return items.map((item) =>
    typeof item === 'string' ? { value: item, label: item } : { value: item.value, label: item.label },
  );
}

export interface UseComboboxRootParameters {
  mode: 'combobox' | 'autocomplete';
  items: ComboboxItems | undefined;
  value?: unknown;
  defaultValue?: unknown;
  onValueChange?: ((value: unknown) => void) | undefined;
  inputValue?: string | undefined;
  defaultInputValue?: string | undefined;
  onInputValueChange?: ((value: string) => void) | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, event?: ZestNativeEvent) => void) | undefined;
  openOnFocus?: boolean | undefined;
  filter?: ((item: ComboboxItem, query: string) => boolean) | undefined;
  disabled: boolean;
}

const defaultFilter = (item: ComboboxItem, query: string) =>
  item.label.toLowerCase().includes(query.toLowerCase());

/**
 * The state behind `Combobox.Root` and `Autocomplete.Root`: the resolved item
 * list, the filtered view of it, the input text, the selection, and the open
 * state — plus the anchor plumbing the popup needs.
 */
export function useComboboxRoot(parameters: UseComboboxRootParameters): ComboboxRootContext {
  const {
    mode,
    items,
    value: valueProp,
    defaultValue,
    onValueChange,
    inputValue: inputValueProp,
    defaultInputValue,
    onInputValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    openOnFocus = true,
    filter = defaultFilter,
    disabled,
  } = parameters;

  const normalized = React.useMemo(() => normalizeItems(items), [items]);

  const [open, setOpenState] = useControlled<boolean>({
    controlled: openProp,
    default: defaultOpen,
    name: 'Combobox',
    state: 'open',
  });

  const [selectedValue, setSelectedValue] = useControlled<unknown>({
    controlled: valueProp,
    default: defaultValue ?? null,
    name: 'Combobox',
    state: 'value',
  });

  // The initial input text is only read on the first render; compute it once so
  // it stays stable, or `useControlled` warns when a later selection changes the
  // controlled `value` (and with it the derived label).
  const initialInputRef = React.useRef<string | undefined>(undefined);
  if (initialInputRef.current === undefined) {
    initialInputRef.current =
      defaultInputValue ??
      (mode === 'combobox'
        ? (normalized.find((item) => item.value === (valueProp ?? defaultValue))?.label ?? '')
        : '');
  }

  const [inputValue, setInputValueState] = useControlled<string>({
    controlled: inputValueProp,
    default: initialInputRef.current,
    name: 'Combobox',
    state: 'inputValue',
  });

  const [triggerNode, setTriggerNode] = React.useState<unknown>(null);
  const [update, setUpdate] = React.useState<(() => void) | undefined>(undefined);

  const setOpen = useStableCallback((nextOpen: boolean, event?: ZestNativeEvent) => {
    if (nextOpen === open) {
      return;
    }
    onOpenChange?.(nextOpen, event);
    setOpenState(nextOpen);
  });

  const setInputValue = useStableCallback((next: string) => {
    onInputValueChange?.(next);
    setInputValueState(next);
    // Typing reopens the list so suggestions follow the query.
    if (!open && next.length > 0) {
      setOpen(true);
    }
  });

  const selectItem = useStableCallback((item: ComboboxItem, event?: ZestNativeEvent) => {
    if (mode === 'combobox') {
      onValueChange?.(item.value);
      setSelectedValue(item.value);
    }
    onInputValueChange?.(item.label);
    setInputValueState(item.label);
    setOpen(false, event);
  });

  // The label of the currently selected value (combobox mode only).
  const selectedLabel =
    mode === 'combobox'
      ? (normalized.find((item) => item.value === selectedValue)?.label ?? '')
      : '';

  // Reflect a controlled `value` that changed from outside into the input text.
  // `selectItem` already sets both, so the ref guard makes that a no-op and stops
  // this from fighting the user's typing (typing never changes `selectedValue`).
  const lastReflectedValueRef = React.useRef(selectedValue);
  useIsoLayoutEffect(() => {
    if (mode !== 'combobox' || selectedValue === lastReflectedValueRef.current) {
      return;
    }
    lastReflectedValueRef.current = selectedValue;
    setInputValueState(selectedLabel);
  }, [mode, selectedValue, selectedLabel, setInputValueState]);

  const filteredItems = React.useMemo(() => {
    // When the input still shows the current selection, the user has not started
    // filtering — show every item so a fresh focus reveals the whole list rather
    // than the single selected row.
    const query = mode === 'combobox' && inputValue === selectedLabel ? '' : inputValue.trim();
    if (query.length === 0) {
      return normalized;
    }
    return normalized.filter((item) => filter(item, query));
  }, [normalized, inputValue, selectedLabel, mode, filter]);

  return React.useMemo(
    () => ({
      mode,
      open,
      setOpen,
      inputValue,
      setInputValue,
      selectedValue,
      selectItem,
      filteredItems,
      disabled,
      openOnFocus,
      triggerNode,
      setTriggerNode,
      update,
      setUpdate,
    }),
    [
      mode,
      open,
      setOpen,
      inputValue,
      setInputValue,
      selectedValue,
      selectItem,
      filteredItems,
      disabled,
      openOnFocus,
      triggerNode,
      update,
    ],
  );
}
