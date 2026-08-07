'use client';
import { View } from 'react-native';
import { useComboboxItemContext } from '../item/ComboboxItemContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ComboboxItemState } from '../item/ComboboxItem';
import type { ZestUIComponentProps } from '../../types';

/**
 * Indicates whether its item is selected.
 * Renders a `<View>`, or nothing while the item is unselected.
 */
export function ComboboxItemIndicator(componentProps: ComboboxItemIndicator.Props) {
  const { render, className, style, keepMounted = false, ref, ...elementProps } = componentProps;

  const { state } = useComboboxItemContext();

  return useRenderElement(View, componentProps, {
    state,
    ref,
    enabled: keepMounted || state.selected,
    props: elementProps,
  });
}

export interface ComboboxItemIndicatorState extends ComboboxItemState {}

export interface ComboboxItemIndicatorProps
  extends ZestUIComponentProps<typeof View, ComboboxItemIndicatorState> {
  /**
   * Whether to keep the element mounted when the item is not selected. Required
   * to animate it out — nothing in React Native can report that an exit
   * animation finished.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace ComboboxItemIndicator {
  export type State = ComboboxItemIndicatorState;
  export type Props = ComboboxItemIndicatorProps;
}
