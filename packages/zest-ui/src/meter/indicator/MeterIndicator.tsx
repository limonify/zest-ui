'use client';
import { View } from 'react-native';
import { useMeterRootContext } from '../root/MeterRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { MeterRootState } from '../root/MeterRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * Visualizes the current value.
 * Renders a `<View>` sized to the value's position in the range.
 */
export function MeterIndicator(componentProps: MeterIndicator.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { percentageValue, state } = useMeterRootContext();

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ style: { width: `${percentageValue}%` as const } }, elementProps],
  });
}

export interface MeterIndicatorState extends MeterRootState {}

export interface MeterIndicatorProps
  extends ZestUIComponentProps<typeof View, MeterIndicatorState> {}

export namespace MeterIndicator {
  export type State = MeterIndicatorState;
  export type Props = MeterIndicatorProps;
}
