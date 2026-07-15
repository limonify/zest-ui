'use client';
import { View } from 'react-native';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { NumberFieldRootState } from '../root/NumberFieldRoot';
import type { BaseUIComponentProps } from '../../types';

/**
 * Groups the input with the increment and decrement buttons.
 * Renders a `<View>`.
 */
export function NumberFieldGroup(componentProps: NumberFieldGroup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { state } = useNumberFieldRootContext();

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ role: 'group' as const }, elementProps],
  });
}

export interface NumberFieldGroupState extends NumberFieldRootState {}

export interface NumberFieldGroupProps
  extends BaseUIComponentProps<typeof View, NumberFieldGroupState> {}

export namespace NumberFieldGroup {
  export type State = NumberFieldGroupState;
  export type Props = NumberFieldGroupProps;
}
