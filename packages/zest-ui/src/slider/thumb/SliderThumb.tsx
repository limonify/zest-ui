'use client';
import { View } from 'react-native';
import { useSliderRootContext } from '../root/SliderRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useFieldControlRegistration } from '../../internals/field/useFieldControlRegistration';
import { formatNumber } from '../../utils/formatNumber';
import type { SliderRootState } from '../root/SliderRoot';
import type { ZestUIComponentProps } from '../../types';

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

  const {
    disabled,
    format,
    getAccessibilityValueText,
    labelId,
    locale,
    max,
    min,
    orientation,
    state,
    values,
  } =
    useSliderRootContext();

  // The thumb is what assistive tech announces and adjusts, so a surrounding
  // field's label and messages attach here rather than to the root.
  const { fieldProps } = useFieldControlRegistration();

  const value = values[index] ?? min;
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;

  // The formatted value is what a screen reader reads out; the consumer can
  // replace it, which is how the two ends of a range read differently. Without
  // `format` there is no text and React Native announces `now` instead — but a
  // consumer's callback still gets a string to build on.
  const formattedValue = formatValue(value, format, locale);
  const valueText = getAccessibilityValueText
    ? getAccessibilityValueText(formattedValue ?? String(value), value, index)
    : formattedValue;

  const positionStyle =
    orientation === 'vertical'
      ? { position: 'absolute' as const, bottom: `${percent}%` as const }
      : { position: 'absolute' as const, left: `${percent}%` as const };

  const thumbState: SliderThumbState = { ...state, index, value, percent };

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
          text: valueText,
        },
        'aria-orientation': orientation,
        ...fieldProps,
        // A surrounding `Field.Label` names the control; `Slider.Label` is the
        // fallback for a slider that stands on its own.
        accessibilityLabelledBy: fieldProps.accessibilityLabelledBy ?? labelId,
        'aria-labelledby': fieldProps['aria-labelledby'] ?? labelId,
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
  /**
   * This thumb's position as a percentage (0-100) of the track.
   */
  percent: number;
}

export interface SliderThumbProps extends ZestUIComponentProps<typeof View, SliderThumbState> {
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
