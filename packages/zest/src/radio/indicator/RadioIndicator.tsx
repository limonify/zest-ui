'use client';
import { View } from 'react-native';
import { useRadioRootContext } from '../root/RadioRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { RadioRootState } from '../root/RadioRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * Indicates whether the radio button is selected.
 * Renders a `<View>`.
 *
 * TODO(animations): transitionStatus support (useTransitionStatus port) so exit
 * animations can keep the indicator mounted.
 */
export function RadioIndicator(componentProps: RadioIndicator.Props) {
  const { render, className, style, keepMounted = false, ref, ...elementProps } = componentProps;

  const rootState = useRadioRootContext();

  const state: RadioIndicatorState = rootState;

  const shouldRender = keepMounted || rootState.checked;

  return useRenderElement(View, componentProps, {
    state,
    ref,
    enabled: shouldRender,
    props: elementProps,
  });
}

export interface RadioIndicatorState extends RadioRootState {}

export interface RadioIndicatorProps
  extends ZestUIComponentProps<typeof View, RadioIndicatorState> {
  /**
   * Whether to keep the element mounted when the radio button is inactive.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace RadioIndicator {
  export type State = RadioIndicatorState;
  export type Props = RadioIndicatorProps;
}
