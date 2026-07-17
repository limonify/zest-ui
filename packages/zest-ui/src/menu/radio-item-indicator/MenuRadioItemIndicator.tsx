'use client';
import { View } from 'react-native';
import { useMenuRadioItemContext } from '../radio-item/MenuRadioItemContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { MenuRadioItemState } from '../radio-item/MenuRadioItem';
import type { ZestUIComponentProps } from '../../types';

/**
 * Indicates whether the radio item is selected.
 * Renders a `<View>`.
 */
export function MenuRadioItemIndicator(componentProps: MenuRadioItemIndicator.Props) {
  const { render, className, style, keepMounted = false, ref, ...elementProps } = componentProps;

  const state = useMenuRadioItemContext();

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
    enabled: keepMounted || state.checked,
  });
}

export interface MenuRadioItemIndicatorState extends MenuRadioItemState {}

export interface MenuRadioItemIndicatorProps
  extends ZestUIComponentProps<typeof View, MenuRadioItemIndicatorState> {
  /**
   * Whether to keep the element mounted when the radio item is not selected.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace MenuRadioItemIndicator {
  export type State = MenuRadioItemIndicatorState;
  export type Props = MenuRadioItemIndicatorProps;
}
