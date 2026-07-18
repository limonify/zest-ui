'use client';
import { Text } from 'react-native';
import { useProgressRootContext } from '../root/ProgressRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ProgressRootState } from '../root/ProgressRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * A text element displaying the current value.
 * Renders a `<Text>`.
 *
 * Hidden from assistive technology: `Progress.Root` already announces the value
 * through its `accessibilityValue`, so reading this too would duplicate it.
 */
export function ProgressValue(componentProps: ProgressValue.Props) {
  const { render, className, style, children, ref, ...elementProps } = componentProps;

  const { value, formattedValue, state } = useProgressRootContext();

  const formattedValueArg = value == null ? 'indeterminate' : formattedValue;
  const formattedValueDisplay = value == null ? null : formattedValue;

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants' as const,
        'aria-hidden': true,
        children:
          typeof children === 'function'
            ? children(formattedValueArg, value)
            : (children ?? formattedValueDisplay),
      },
      elementProps,
    ],
  });
}

export interface ProgressValueState extends ProgressRootState {}

export interface ProgressValueProps
  extends Omit<ZestUIComponentProps<typeof Text, ProgressValueState>, 'children'> {
  children?:
    | React.ReactNode
    | ((formattedValue: string, value: number | null) => React.ReactNode);
}

export namespace ProgressValue {
  export type State = ProgressValueState;
  export type Props = ProgressValueProps;
}
