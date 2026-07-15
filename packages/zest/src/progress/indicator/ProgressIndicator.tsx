'use client';
import { View } from 'react-native';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ProgressRootState } from '../root/ProgressRoot';
import type { BaseUIComponentProps } from '../../types';

/**
 * Visualizes the completion status of the task.
 * Renders a `<View>` sized to the current value.
 *
 * While indeterminate, no width is applied at all — there is no value to show,
 * so the consumer owns that appearance entirely (an indeterminate bar is
 * usually an animation, which zest never runs itself; read `state.status`).
 */
export function ProgressIndicator(componentProps: ProgressIndicator.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { percentageValue, state } = useProgressRootContext();

  const indicatorStyle =
    percentageValue == null ? undefined : { width: `${percentageValue}%` as const };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ style: indicatorStyle }, elementProps],
  });
}

export interface ProgressIndicatorState extends ProgressRootState {}

export interface ProgressIndicatorProps
  extends BaseUIComponentProps<typeof View, ProgressIndicatorState> {}

export namespace ProgressIndicator {
  export type State = ProgressIndicatorState;
  export type Props = ProgressIndicatorProps;
}
