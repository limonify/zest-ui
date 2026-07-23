'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useComboboxRootContext, type ComboboxItem as ComboboxItemData } from '../root/ComboboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import type { ZestUIComponentProps } from '../../types';

/**
 * A selectable item in the list.
 * Renders a `<Pressable>`.
 */
export function ComboboxItem(componentProps: ComboboxItem.Props) {
  const { render, className, style, item, ref, ...elementProps } = componentProps;

  const { selectedValue, selectItem, inputRef } = useComboboxRootContext();
  const { onLayout } = useCompositeListItem();

  const [pressed, setPressed] = React.useState(false);
  const selected = selectedValue === item.value;

  const state: ComboboxItemState = { selected, pressed };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onLayout,
        onPress(event: GestureResponderEvent) {
          selectItem(item, event);
          inputRef?.current?.blur();
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
  selected: boolean;
  pressed: boolean;
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
