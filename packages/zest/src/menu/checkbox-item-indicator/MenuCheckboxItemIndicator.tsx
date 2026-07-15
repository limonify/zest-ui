'use client';
import { View } from 'react-native';
import { useMenuCheckboxItemContext } from '../checkbox-item/MenuCheckboxItemContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { MenuCheckboxItemState } from '../checkbox-item/MenuCheckboxItem';
import type { BaseUIComponentProps } from '../../types';

/**
 * Indicates whether the checkbox item is ticked.
 * Renders a `<View>`.
 */
export function MenuCheckboxItemIndicator(componentProps: MenuCheckboxItemIndicator.Props) {
  const { render, className, style, keepMounted = false, ref, ...elementProps } = componentProps;

  const state = useMenuCheckboxItemContext();

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
    enabled: keepMounted || state.checked,
  });
}

export interface MenuCheckboxItemIndicatorState extends MenuCheckboxItemState {}

export interface MenuCheckboxItemIndicatorProps
  extends BaseUIComponentProps<typeof View, MenuCheckboxItemIndicatorState> {
  /**
   * Whether to keep the element mounted when the checkbox item is not ticked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace MenuCheckboxItemIndicator {
  export type State = MenuCheckboxItemIndicatorState;
  export type Props = MenuCheckboxItemIndicatorProps;
}
