'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxItemsContext } from '../root/ComboboxItemsContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ComboboxItem } from '../store/ComboboxStore';
import type { ZestUIComponentProps } from '../../types';

/**
 * Renders the filtered items through a render function.
 * Renders a `<View>`.
 *
 * ```tsx
 * <Combobox.List>{(item) => <Combobox.Item key={String(item.value)} item={item} />}</Combobox.List>
 * ```
 */
export function ComboboxList(componentProps: ComboboxList.Props) {
  const { render, className, style, children, ref, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { filteredItems } = useComboboxItemsContext();

  const open = store.useState('open');

  const state: ComboboxListState = { open, empty: filteredItems.length === 0 };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ children: filteredItems.map((item) => children(item)) }, elementProps],
  });
}

export interface ComboboxListState {
  open: boolean;
  empty: boolean;
}

export interface ComboboxListProps
  extends Omit<ZestUIComponentProps<typeof View, ComboboxListState>, 'children'> {
  children: (item: ComboboxItem) => React.ReactNode;
}

export namespace ComboboxList {
  export type State = ComboboxListState;
  export type Props = ComboboxListProps;
}
