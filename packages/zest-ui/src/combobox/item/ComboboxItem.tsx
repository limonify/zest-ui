'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { isValueSelected } from '../../utils/selection';
import type { ComboboxItem as ComboboxItemData } from '../store/ComboboxStore';
import { ComboboxItemContext } from './ComboboxItemContext';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * A selectable item in the list.
 * Renders a `<Pressable>`.
 */
export function ComboboxItem(componentProps: ComboboxItem.Props) {
  const { render, className, style, item, ref, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const selectedValue = useStoreState(store, 'value');
  const multiple = useStoreState(store, 'multiple');
  const isItemEqualToValue = useStoreState(store, 'isItemEqualToValue');

  const { index, onLayout } = useCompositeListItem();

  const [pressed, setPressed] = React.useState(false);
  const selected = isValueSelected(selectedValue, item.value, multiple, isItemEqualToValue);

  const state: ComboboxItemState = React.useMemo(
    () => ({ selected, pressed, index }),
    [selected, pressed, index],
  );

  const contextValue: ComboboxItemContext = React.useMemo(() => ({ state }), [state]);

  const element = useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onLayout,
        onPress(event: GestureResponderEvent) {
          store.selectItem(item, createChangeEventDetails(REASONS.itemPress, event));

          // Dismissing the keyboard is right when the selection ends the
          // interaction. A multiple combobox expects the next pick — and clears
          // the input for it — so taking the keyboard away would be wrong.
          if (!store.select('multiple')) {
            store.select('inputRef')?.current?.blur();
          }
        },
        onPressIn: () => setPressed(true),
        onPressOut: () => setPressed(false),
        accessibilityRole: 'menuitem' as const,
        role: 'option' as const,
        accessibilityState: { selected },
        'aria-selected': selected,
      },
      elementProps,
    ],
  });

  return <ComboboxItemContext.Provider value={contextValue}>{element}</ComboboxItemContext.Provider>;
}

export interface ComboboxItemState {
  /**
   * Whether this item is the selected one.
   */
  selected: boolean;
  /**
   * Whether the item is currently pressed.
   */
  pressed: boolean;
  /**
   * The item's index in the list, in visual order.
   */
  index: number;
}

export interface ComboboxItemProps extends ZestUIComponentProps<typeof Pressable, ComboboxItemState> {
  /**
   * The item this row represents, as handed to you by `Combobox.List`.
   */
  item: ComboboxItemData;
}

export namespace ComboboxItem {
  export type State = ComboboxItemState;
  export type Props = ComboboxItemProps;
}
