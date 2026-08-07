'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxItemsContext } from '../root/ComboboxItemsContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ComboboxEntry } from '../store/ComboboxStore';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * Renders the filtered items through a render function.
 * Renders a `<View>`.
 *
 * ```tsx
 * <Combobox.List>{(item) => <Combobox.Item key={String(item.value)} item={item} />}</Combobox.List>
 * ```
 *
 * When `items` holds groups, the render function receives each group instead —
 * wrap it in `Combobox.Group` and render its items with `Combobox.Collection`.
 */
export function ComboboxList(componentProps: ComboboxList.Props) {
  const { render, className, style, children, ref, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { filteredItems, filteredItemCount } = useComboboxItemsContext();

  const open = useStoreState(store, 'open');

  const state: ComboboxListState = { open, empty: filteredItemCount === 0 };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ children: filteredItems.map((entry, index) => children(entry, index)) }, elementProps],
  });
}

export interface ComboboxListState {
  open: boolean;
  /**
   * Whether no selectable item survived filtering. Groups do not count — an
   * empty group is not content.
   */
  empty: boolean;
}

export interface ComboboxListProps
  extends Omit<ZestUIComponentProps<typeof View, ComboboxListState>, 'children'> {
  children: (entry: ComboboxEntry, index: number) => React.ReactNode;
}

export namespace ComboboxList {
  export type State = ComboboxListState;
  export type Props = ComboboxListProps;
}
