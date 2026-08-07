'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { usePopupRootHandle } from '../../utils/popups/usePopupRootHandle';
import { useFilter } from '../../filter/useFilter';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useFieldControlRegistration } from '../../internals/field/useFieldControlRegistration';
import {
  compareItemEquality,
  defaultItemEquality,
  type ItemEqualityComparer,
} from '../../internals/itemEquality';
import type { ComboboxHandle } from '../store/ComboboxHandle';
import {
  ComboboxStore,
  flattenComboboxEntries,
  isComboboxGroup,
  normalizeComboboxItems,
  resolveComboboxSelection,
  type ComboboxEntry,
  type ComboboxItem,
  type ComboboxItems,
} from '../store/ComboboxStore';
import type { ComboboxRoot } from './ComboboxRoot';
import { ComboboxItemsContext } from './ComboboxItemsContext';
import { ComboboxSelectionContext } from './ComboboxSelectionContext';
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
  multiple?: boolean | undefined;
  isItemEqualToValue?: ItemEqualityComparer | undefined;
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
    disabled: disabledProp = false,
    filter,
    handle,
    inputValue,
    isItemEqualToValue = defaultItemEquality,
    items,
    multiple = false,
    onInputValueChange,
    onOpenChange,
    onValueChange,
    open,
    openOnFocus = true,
    triggerId,
    value,
  } = props;

  // `entries` keeps the grouping the consumer wrote; `normalizedItems` is the flat
  // list of selectable items, which is what every selection lookup runs against.
  const entries = React.useMemo(() => normalizeComboboxItems(items), [items]);
  const normalizedItems = React.useMemo(() => flattenComboboxEntries(entries), [entries]);

  // A combobox reports itself to a surrounding `Field.Root` exactly as `Select`
  // does. An autocomplete has no separate selection, so the text it holds *is*
  // its value as far as the field is concerned.

  const ownsText = mode === 'autocomplete';

  // The field needs a way to focus the input when a form stops on this control,
  // but the input's ref lives in the store, which is created below. A stable
  // shim reads it through a ref the effect fills in.
  const storeRef = React.useRef<ComboboxStore | null>(null);
  const fieldFocusRef = useRefWithInit(() => ({
    focus() {
      storeRef.current?.select('inputRef')?.current?.focus();
    },
  }));

  const { fieldDisabled, markChanged, markTouched } = useFieldControlRegistration({
    initialValue: ownsText
      ? (defaultInputValue ?? inputValue ?? '')
      : (defaultValue ?? value ?? null),
    ownsValue: true,
    focusRef: fieldFocusRef,
  });

  const disabled = disabledProp || fieldDisabled;

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
        // A multiple combobox's selection is a list, so an omitted default is an
        // empty one rather than "nothing selected".
        value: defaultValue ?? (multiple ? [] : null),
        valueProp: value,
        // The initial input text is only ever read here, and this closure only runs on the
        // first render — so deriving it inline keeps it stable. Recomputing it later would
        // make a selection that changes the controlled `value` (and with it the derived
        // label) look like a controlled/uncontrolled switch. A multiple combobox never
        // shows its selection in the input, so it starts blank.
        inputValue:
          defaultInputValue ??
          (mode === 'combobox' && !multiple
            ? (normalizedItems.find((item) =>
                compareItemEquality(item.value, value ?? defaultValue, isItemEqualToValue),
              )?.label ?? '')
            : ''),
        inputValueProp: inputValue,
        items: normalizedItems,
        mode,
        multiple,
        isItemEqualToValue,
        disabled,
        disablePointerDismissal,
        openOnFocus,
        triggerId: defaultTriggerId,
        triggerIdProp: triggerId,
      }),
  ).current;

  // Wrapping the consumer's callbacks is what lets a combobox report itself to a
  // surrounding `Field.Root`: choosing a value makes the field dirty, and
  // closing the list is the combobox's equivalent of a blur.
  const handleValueChange = useStableCallback(
    (nextValue: unknown, eventDetails: ComboboxRoot.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled || ownsText) {
        return;
      }

      markChanged(nextValue);
    },
  );

  const handleInputValueChange = useStableCallback(
    (nextValue: string, eventDetails: ComboboxRoot.ChangeEventDetails) => {
      onInputValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled || !ownsText) {
        return;
      }

      markChanged(nextValue);
    },
  );

  const handleOpenChange = useStableCallback(
    (nextOpen: boolean, eventDetails: ComboboxRoot.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled || nextOpen) {
        return;
      }

      markTouched(ownsText ? store.select('inputValue') : store.select('value'));
    },
  );

  useIsoLayoutEffect(() => {
    storeRef.current = store;
  }, [store]);

  useControlledProp(store, 'openProp', open);
  useControlledProp(store, 'valueProp', value);
  useControlledProp(store, 'inputValueProp', inputValue);
  useControlledProp(store, 'triggerIdProp', triggerId);
  useContextCallback(store, 'onOpenChange', handleOpenChange);
  useContextCallback(store, 'onValueChange', handleValueChange);
  useContextCallback(store, 'onInputValueChange', handleInputValueChange);
  useSyncedValues(store, {
    mode,
    multiple,
    isItemEqualToValue,
    disabled,
    disablePointerDismissal,
    openOnFocus,
    items: normalizedItems,
  });

  usePopupRootHandle({ store, handle, actionsRef });

  const resolvedOpen = useStoreState(store, 'open');
  const selectedValue = useStoreState(store, 'value');
  const currentInputValue = useStoreState(store, 'inputValue');

  // The label of the currently selected value. Only single selection has one:
  // a multiple combobox keeps its input free for the query, and an autocomplete
  // has no selection at all.
  const singleSelection = mode === 'combobox' && !multiple;
  const selectedLabel = singleSelection
    ? (normalizedItems.find((item) =>
        compareItemEquality(item.value, selectedValue, isItemEqualToValue),
      )?.label ?? '')
    : '';

  // Reflect a controlled `value` that changed from outside into the input text.
  // `selectItem` already sets both, so the ref guard makes that a no-op and stops
  // this from fighting the user's typing (typing never changes the selection).
  const lastReflectedValueRef = React.useRef(selectedValue);
  useIsoLayoutEffect(() => {
    if (!singleSelection || selectedValue === lastReflectedValueRef.current) {
      return;
    }
    lastReflectedValueRef.current = selectedValue;
    store.reflectInputValue(selectedLabel);
  }, [singleSelection, selectedValue, selectedLabel, store]);

  const filteredItems = React.useMemo(() => {
    // When the input still shows the current selection, the user has not started
    // filtering — show every item so a fresh focus reveals the whole list rather
    // than the single selected row. Only single selection can be in that state;
    // everywhere else the input holds nothing but the query.
    const query =
      singleSelection && currentInputValue === selectedLabel ? '' : currentInputValue.trim();
    if (query.length === 0) {
      return entries;
    }

    // Filtering runs inside a group and the group survives only if something in
    // it did. A group is never matched on its own label: a query that happens to
    // spell a group name should not resurrect every item under it.
    const matches: ComboboxEntry[] = [];
    for (const entry of entries) {
      if (!isComboboxGroup(entry)) {
        if (filterItem(entry, query)) {
          matches.push(entry);
        }
        continue;
      }

      const items = entry.items.filter((item) => filterItem(item, query));
      if (items.length > 0) {
        matches.push({ ...entry, items });
      }
    }

    return matches;
  }, [entries, currentInputValue, selectedLabel, singleSelection, filterItem]);

  // Groups are structure, not content — the list is empty when no selectable
  // item survived, whatever wrappers are left standing.
  const filteredItemCount = React.useMemo(
    () => flattenComboboxEntries(filteredItems).length,
    [filteredItems],
  );

  const selectedItems = React.useMemo(
    () => resolveComboboxSelection(normalizedItems, selectedValue, multiple, isItemEqualToValue),
    [normalizedItems, selectedValue, multiple, isItemEqualToValue],
  );

  const { transitionStatus } = useTransitionStatus(resolvedOpen, false, true);

  const itemsContextValue = React.useMemo(
    () => ({ filteredItems, filteredItemCount }),
    [filteredItems, filteredItemCount],
  );

  // Kept apart from the filtered items: they change for different reasons, and
  // sharing one context would re-render the whole list on every selection.
  const selectionContextValue = React.useMemo(() => ({ selectedItems }), [selectedItems]);
  const transitionContextValue = React.useMemo(() => ({ transitionStatus }), [transitionStatus]);

  const payload = useStoreState(store, 'payload') as Payload;

  return (
    <ComboboxRootContext.Provider value={store}>
      <ComboboxItemsContext.Provider value={itemsContextValue}>
        <ComboboxSelectionContext.Provider value={selectionContextValue}>
        <ComboboxTransitionContext.Provider value={transitionContextValue}>
          {typeof children === 'function' ? children(payload) : children}
        </ComboboxTransitionContext.Provider>
        </ComboboxSelectionContext.Provider>
      </ComboboxItemsContext.Provider>
    </ComboboxRootContext.Provider>
  );
}
