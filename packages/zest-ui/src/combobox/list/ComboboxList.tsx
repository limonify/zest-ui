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
 *
 * The filtered entries are also on `state.items`, which is what lets a `render`
 * function hand them to a virtualized list instead.
 */
export function ComboboxList(componentProps: ComboboxList.Props) {
  const { render, className, style, children, ref, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { filteredItems, filteredItemCount } = useComboboxItemsContext();

  const open = useStoreState(store, 'open');

  const state: ComboboxListState = React.useMemo(
    () => ({ open, empty: filteredItemCount === 0, items: filteredItems }),
    [open, filteredItemCount, filteredItems],
  );

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      { children: children ? filteredItems.map((entry, index) => children(entry, index)) : undefined },
      elementProps,
    ],
  });
}

export interface ComboboxListState {
  open: boolean;
  /**
   * Whether no selectable item survived filtering. Groups do not count — an
   * empty group is not content.
   */
  empty: boolean;
  /**
   * The entries left after filtering, in order — the same ones `children`
   * receives. A `render` function needs them to feed a virtualized list, which
   * takes its rows from `data` rather than from children.
   */
  items: ComboboxEntry[];
}

export interface ComboboxListProps
  extends Omit<ZestUIComponentProps<typeof View, ComboboxListState>, 'children'> {
  /**
   * Renders one entry. Omit it when a `render` function draws the rows itself —
   * a `FlatList`, say, which takes them from `data`.
   */
  children?: ((entry: ComboboxEntry, index: number) => React.ReactNode) | undefined;
}

export namespace ComboboxList {
  export type State = ComboboxListState;
  export type Props = ComboboxListProps;
}
