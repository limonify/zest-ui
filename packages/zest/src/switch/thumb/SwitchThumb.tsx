'use client';
import { View } from 'react-native';
import { useSwitchRootContext } from '../root/SwitchRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { SwitchRootState } from '../root/SwitchRoot';
import type { BaseUIComponentProps } from '../../types';

/**
 * The movable part of the switch that indicates whether the switch is on or off.
 * Renders a `<View>`.
 */
export function SwitchThumb(componentProps: SwitchThumb.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const state = useSwitchRootContext();

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });
}

export interface SwitchThumbState extends SwitchRootState {}

export interface SwitchThumbProps
  extends BaseUIComponentProps<typeof View, SwitchThumbState> {}

export namespace SwitchThumb {
  export type State = SwitchThumbState;
  export type Props = SwitchThumbProps;
}
