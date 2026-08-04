'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { usePopupRootHandle } from '../../utils/popups/usePopupRootHandle';
import { useFilter } from '../../filter/useFilter';
import type { ComboboxHandle } from '../store/ComboboxHandle';
import {
  ComboboxStore,
  normalizeComboboxItems,
  type ComboboxItem,
  type ComboboxItems,
} from '../store/ComboboxStore';
import type { ComboboxRoot } from './ComboboxRoot';
import { ComboboxItemsContext } from './ComboboxItemsContext';
import { ComboboxRootContext } from './ComboboxRootContext';
import { ComboboxTransitionContext } from './ComboboxTransitionContext';
import { useContextCallback, useControlledProp, useStoreState, useSyncedValues } from '../../store/ReactStore';

export type ComboboxMode = 'combobox' | 'autocomplete';

/**
 * The props both `Combobox.Root` and `Autocomplete.Root` accept. An
 * autocomplete's value *is* its input text, so it omits the selection props.
 */
export interface UseRenderComboboxRootProps<Payload = unknown> {
  items?: ComboboxItems | undefined;
  value?: unknown;
  defaultValue?: unknown;
  onValueChange?: ((value: any, eventDetails: ComboboxRoot.ChangeEventDetails) => void) | undefined;
  inputValue?: string | undefined;
  defaultInputValue?: string | undefined;
  onInputValueChange?:
    | ((value: string, eventDetails: ComboboxRoot.ChangeEventDetails) => void)
    | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean, eventDetails: ComboboxRoot.ChangeEventDetails) => void) | undefined;
  openOnFocus?: boolean | undefined;
  filter?: ((item: ComboboxItem, query: string) => boolean) | undefined;
  disabled?: boolean | undefined;
  disablePointerDismissal?: boolean | undefined;
  actionsRef?: React.RefObject<ComboboxRoot.Actions | null> | undefined;
  handle?: ComboboxHandle | undefined;
  triggerId?: string | null | undefined;
  defaultTriggerId?: string | null | undefined;
  children?: React.ReactNode | ((payload: Payload) => React.ReactNode);
}

/**
 * The shared Root implementation behind `Combobox.Root` and `Autocomplete.Root`.
 *
 * The two differ only in whether choosing an item records a separate value:
 * a combobox selects `item.value` and shows its label, an autocomplete puts the
 * typed text itself forward and treats the list as suggestions.
 */
export function useRenderComboboxRoot<Payload = unknown>(
  props: UseRenderComboboxRootProps<Payload>,
  mode: ComboboxMode,
) {
  const {
    actionsRef,
    children,
    defaultInputValue,
    defaultOpen = false,
    defaultTriggerId = null,
    defaultValue,
    disablePointerDismissal = false,
    disabled = false,
    filter,
    handle,
    inputValue,
    items,
    onInputValueChange,
    onOpenChange,
    onValueChange,
    open,
    openOnFocus = true,
    triggerId,
    value,
  } = props;

  const normalizedItems = React.useMemo(() => normalizeComboboxItems(items), [items]);

  const { contains } = useFilter();
  const filterItem = React.useMemo(
    () => filter ?? ((item: ComboboxItem, query: string) => contains(item.label, query)),
    [filter, contains],
  );

  const store = useRefWithInit(
    () =>
      new ComboboxStore({
        open: defaultOpen,
        openProp: open,
        value: defaultValue ?? null,
        valueProp: value,
        // The initial input text is only ever read here, and this closure only runs on the
        // first render — so deriving it inline keeps it stable. Recomputing it later would
        // make a selection that changes the controlled `value` (and with it the derived
        // label) look like a controlled/uncontrolled switch.
        inputValue:
          defaultInputValue ??
          (mode === 'combobox'
            ? (normalizedItems.find((item) => item.value === (value ?? defaultValue))?.label ?? '')
            : ''),
        inputValueProp: inputValue,
        items: normalizedItems,
        mode,
        disabled,
        disablePointerDismissal,
        openOnFocus,
        triggerId: defaultTriggerId,
        triggerIdProp: triggerId,
      }),
  ).current;

  useControlledProp(store, 'openProp', open);
  useControlledProp(store, 'valueProp', value);
  useControlledProp(store, 'inputValueProp', inputValue);
  useControlledProp(store, 'triggerIdProp', triggerId);
  useContextCallback(store, 'onOpenChange', onOpenChange);
  useContextCallback(store, 'onValueChange', onValueChange);
  useContextCallback(store, 'onInputValueChange', onInputValueChange);
  useSyncedValues(store, {
    mode,
    disabled,
    disablePointerDismissal,
    openOnFocus,
    items: normalizedItems,
  });

  usePopupRootHandle({ store, handle, actionsRef });

  const resolvedOpen = useStoreState(store, 'open');
  const selectedValue = useStoreState(store, 'value');
  const currentInputValue = useStoreState(store, 'inputValue');

  // The label of the currently selected value (combobox mode only).
  const selectedLabel =
    mode === 'combobox'
      ? (normalizedItems.find((item) => item.value === selectedValue)?.label ?? '')
      : '';

  // Reflect a controlled `value` that changed from outside into the input text.
  // `selectItem` already sets both, so the ref guard makes that a no-op and stops
  // this from fighting the user's typing (typing never changes the selection).
  const lastReflectedValueRef = React.useRef(selectedValue);
  useIsoLayoutEffect(() => {
    if (mode !== 'combobox' || selectedValue === lastReflectedValueRef.current) {
      return;
    }
    lastReflectedValueRef.current = selectedValue;
    store.reflectInputValue(selectedLabel);
  }, [mode, selectedValue, selectedLabel, store]);

  const filteredItems = React.useMemo(() => {
    // When the input still shows the current selection, the user has not started
    // filtering — show every item so a fresh focus reveals the whole list rather
    // than the single selected row.
    const query =
      mode === 'combobox' && currentInputValue === selectedLabel ? '' : currentInputValue.trim();
    if (query.length === 0) {
      return normalizedItems;
    }
    return normalizedItems.filter((item) => filterItem(item, query));
  }, [normalizedItems, currentInputValue, selectedLabel, mode, filterItem]);

  const { transitionStatus } = useTransitionStatus(resolvedOpen, false, true);

  const itemsContextValue = React.useMemo(() => ({ filteredItems }), [filteredItems]);
  const transitionContextValue = React.useMemo(() => ({ transitionStatus }), [transitionStatus]);

  const payload = useStoreState(store, 'payload') as Payload;

  return (
    <ComboboxRootContext.Provider value={store}>
      <ComboboxItemsContext.Provider value={itemsContextValue}>
        <ComboboxTransitionContext.Provider value={transitionContextValue}>
          {typeof children === 'function' ? children(payload) : children}
        </ComboboxTransitionContext.Provider>
      </ComboboxItemsContext.Provider>
    </ComboboxRootContext.Provider>
  );
}
