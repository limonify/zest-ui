'use client';
import * as React from 'react';
import { useComboboxItemsContext } from '../root/ComboboxItemsContext';
import { useOptionalComboboxGroupContext } from '../group/ComboboxGroupContext';
import { flattenComboboxEntries, type ComboboxItem } from '../store/ComboboxStore';

/**
 * Renders the filtered items through a render function.
 * Doesn't render its own element.
 *
 * Inside a `Combobox.Group` it renders that group's items; anywhere else, every
 * filtered item with groups flattened away. A flat list needs neither — pass the
 * render function to `Combobox.List` directly.
 */
export function ComboboxCollection(props: ComboboxCollection.Props) {
  const { children } = props;

  const { filteredItems } = useComboboxItemsContext();
  const group = useOptionalComboboxGroupContext();

  const items = React.useMemo(
    () => group?.items ?? flattenComboboxEntries(filteredItems),
    [group, filteredItems],
  );

  return <React.Fragment>{items.map((item, index) => children(item, index))}</React.Fragment>;
}

export interface ComboboxCollectionState {}

export interface ComboboxCollectionProps {
  children: (item: ComboboxItem, index: number) => React.ReactNode;
}

export namespace ComboboxCollection {
  export type State = ComboboxCollectionState;
  export type Props = ComboboxCollectionProps;
}
