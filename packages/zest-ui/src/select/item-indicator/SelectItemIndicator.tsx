'use client';
import { View } from 'react-native';
import { useSelectItemContext } from '../item/SelectItemContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { SelectItemState } from '../item/SelectItem';
import type { ZestUIComponentProps } from '../../types';

/**
 * Indicates whether the select item is the selected one.
 * Renders a `<View>`.
 */
export function SelectItemIndicator(componentProps: SelectItemIndicator.Props) {
  const { render, className, style, keepMounted = false, ref, ...elementProps } = componentProps;

  const { state } = useSelectItemContext();

  const shouldRender = keepMounted || state.selected;

  return useRenderElement(View, componentProps, {
    state,
    ref,
    enabled: shouldRender,
    props: elementProps,
  });
}

export interface SelectItemIndicatorState extends SelectItemState {}

export interface SelectItemIndicatorProps
  extends ZestUIComponentProps<typeof View, SelectItemIndicatorState> {
  /**
   * Whether to keep the element mounted when the item is not selected.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace SelectItemIndicator {
  export type State = SelectItemIndicatorState;
  export type Props = SelectItemIndicatorProps;
}
