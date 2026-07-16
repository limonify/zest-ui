'use client';
import { View } from 'react-native';
import { useCheckboxRootContext } from '../root/CheckboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { CheckboxRootState } from '../root/CheckboxRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * Indicates whether the checkbox is ticked.
 * Renders a `<View>`.
 *
 * TODO(m2): transitionStatus support (useTransitionStatus port) so exit
 * animations can keep the indicator mounted.
 */
export function CheckboxIndicator(componentProps: CheckboxIndicator.Props) {
  const { render, className, style, keepMounted = false, ref, ...elementProps } = componentProps;

  const rootState = useCheckboxRootContext();

  const rendered = rootState.checked || rootState.indeterminate;

  const state: CheckboxIndicatorState = rootState;

  const shouldRender = keepMounted || rendered;

  const element = useRenderElement(View, componentProps, {
    ref,
    state,
    enabled: shouldRender,
    props: elementProps,
  });

  return element;
}

export interface CheckboxIndicatorState extends CheckboxRootState {}

export interface CheckboxIndicatorProps
  extends ZestUIComponentProps<typeof View, CheckboxIndicatorState> {
  /**
   * Whether to keep the element mounted when the checkbox is not checked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace CheckboxIndicator {
  export type State = CheckboxIndicatorState;
  export type Props = CheckboxIndicatorProps;
}
