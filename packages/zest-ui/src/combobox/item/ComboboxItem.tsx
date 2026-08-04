'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { ComboboxItem as ComboboxItemData } from '../store/ComboboxStore';
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

  const { index, onLayout } = useCompositeListItem();

  const [pressed, setPressed] = React.useState(false);
  const selected = selectedValue === item.value;

  const state: ComboboxItemState = React.useMemo(
    () => ({ selected, pressed, index }),
    [selected, pressed, index],
  );

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onLayout,
        onPress(event: GestureResponderEvent) {
          store.selectItem(item, createChangeEventDetails(REASONS.itemPress, event));
          store.select('inputRef')?.current?.blur();
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
