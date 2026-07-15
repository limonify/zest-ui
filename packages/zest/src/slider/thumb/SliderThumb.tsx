'use client';
import { View } from 'react-native';
import { useSliderRootContext } from '../root/SliderRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { formatNumber } from '../../utils/formatNumber';
import type { SliderRootState } from '../root/SliderRoot';
import type { BaseUIComponentProps } from '../../types';

/**
 * The draggable handle.
 * Renders a `<View>` positioned along the track.
 *
 * The drag itself is owned by `Slider.Control`, which is what gets measured — a
 * thumb never needs its own gesture. `accessibilityRole="adjustable"` is what
 * lets assistive technology change the value.
 */
export function SliderThumb(componentProps: SliderThumb.Props) {
  const { render, className, style, index = 0, ref, ...elementProps } = componentProps;

  const { disabled, format, locale, max, min, orientation, state, values } =
    useSliderRootContext();

  const value = values[index] ?? min;
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;

  const positionStyle =
    orientation === 'vertical'
      ? { position: 'absolute' as const, bottom: `${percent}%` as const }
      : { position: 'absolute' as const, left: `${percent}%` as const };

  const thumbState: SliderThumbState = { ...state, index, value };

  return useRenderElement(View, componentProps, {
    state: thumbState,
    ref,
    props: [
      {
        style: positionStyle,
        accessibilityRole: 'adjustable' as const,
        accessibilityState: { disabled: disabled || undefined },
        accessibilityValue: {
          min,
          max,
          now: value,
          text: formatValue(value, format, locale),
        },
        'aria-orientation': orientation,
      },
      elementProps,
    ],
  });
}

function formatValue(
  value: number,
  format: Intl.NumberFormatOptions | undefined,
  locale: Intl.LocalesArgument | undefined,
) {
  if (!format) {
    return undefined;
  }

  return formatNumber(value, locale, format);
}

export interface SliderThumbState extends SliderRootState {
  /**
   * This thumb's index, which matters for range sliders.
   */
  index: number;
  /**
   * This thumb's value.
   */
  value: number;
}

export interface SliderThumbProps extends BaseUIComponentProps<typeof View, SliderThumbState> {
  /**
   * Which value this thumb controls. Range sliders give each thumb its own index.
   * @default 0
   */
  index?: number | undefined;
}

export namespace SliderThumb {
  export type State = SliderThumbState;
  export type Props = SliderThumbProps;
}
