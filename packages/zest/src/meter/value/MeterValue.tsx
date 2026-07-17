'use client';
import type * as React from 'react';
import { Text } from 'react-native';
import { useMeterRootContext } from '../root/MeterRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';

/**
 * A text element displaying the current value.
 * Renders a `<Text>`.
 *
 * Hidden from assistive technology: `Meter.Root` already announces the value
 * through its `accessibilityValue`, so reading this too would duplicate it.
 */
export function MeterValue(componentProps: MeterValue.Props) {
  const { render, className, style, children, ref, ...elementProps } = componentProps;

  const { value, formattedValue } = useMeterRootContext();

  const state: MeterValueState = {};

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants' as const,
        'aria-hidden': true,
        children:
          typeof children === 'function' ? children(formattedValue, value) : (children ?? formattedValue),
      },
      elementProps,
    ],
  });
}

export interface MeterValueState {}

export interface MeterValueProps
  extends Omit<ZestUIComponentProps<typeof Text, MeterValueState>, 'children'> {
  children?: React.ReactNode | ((formattedValue: string, value: number) => React.ReactNode);
}

export namespace MeterValue {
  export type State = MeterValueState;
  export type Props = MeterValueProps;
}
