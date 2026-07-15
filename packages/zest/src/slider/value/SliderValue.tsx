'use client';
import { Text } from 'react-native';
import { useSliderRootContext } from '../root/SliderRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { SliderRootState } from '../root/SliderRoot';
import type { BaseUIComponentProps } from '../../types';

/**
 * The formatted value of the slider.
 * Renders a `<Text>`.
 */
export function SliderValue(componentProps: SliderValue.Props) {
  const { render, className, style, children, ref, ...elementProps } = componentProps;

  const { format, locale, state, values } = useSliderRootContext();

  const formatted = values.map((value) => formatValue(value, format, locale));

  const resolvedChildren =
    typeof children === 'function' ? children(formatted, values) : (children ?? formatted.join(' – '));

  return useRenderElement(Text, componentProps, {
    state,
    ref,
    props: [elementProps, { children: resolvedChildren }],
  });
}

function formatValue(
  value: number,
  format: Intl.NumberFormatOptions | undefined,
  locale: Intl.LocalesArgument | undefined,
) {
  if (!format) {
    return String(value);
  }

  return new Intl.NumberFormat(locale as string | string[] | undefined, format).format(value);
}

export interface SliderValueState extends SliderRootState {}

export interface SliderValueProps
  extends Omit<BaseUIComponentProps<typeof Text, SliderValueState>, 'children'> {
  children?:
    | React.ReactNode
    | ((formattedValues: string[], values: readonly number[]) => React.ReactNode);
}

export namespace SliderValue {
  export type State = SliderValueState;
  export type Props = SliderValueProps;
}
