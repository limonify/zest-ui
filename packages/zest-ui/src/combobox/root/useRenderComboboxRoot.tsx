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

  // The initial input text is only read on the first render; compute it once so
  // it stays stable, or a later selection changing the controlled `value` (and
  // with it the derived label) would look like a controlled/uncontrolled switch.
  const initialInputRef = React.useRef<string | undefined>(undefined);
  if (initialInputRef.current === undefined) {
    initialInputRef.current =
      defaultInputValue ??
      (mode === 'combobox'
        ? (normalizedItems.find((item) => item.value === (value ?? defaultValue))?.label ?? '')
        : '');
  }

  const store = useRefWithInit(
    () =>
      new ComboboxStore({
        open: defaultOpen,
        openProp: open,
        value: defaultValue ?? null,
        valueProp: value,
        inputValue: initialInputRef.current!,
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

  store.useControlledProp('openProp', open);
  store.useControlledProp('valueProp', value);
  store.useControlledProp('inputValueProp', inputValue);
  store.useControlledProp('triggerIdProp', triggerId);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onValueChange', onValueChange);
  store.useContextCallback('onInputValueChange', onInputValueChange);
  store.useSyncedValues({
    mode,
    disabled,
    disablePointerDismissal,
    openOnFocus,
    items: normalizedItems,
  });

  usePopupRootHandle({ store, handle, actionsRef });

  const resolvedOpen = store.useState('open');
  const selectedValue = store.useState('value');
  const currentInputValue = store.useState('inputValue');

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

  const payload = store.useState('payload') as Payload;

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
