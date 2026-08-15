'use client';
import { View } from 'react-native';
import { useSliderRootContext } from '../root/SliderRootContext';
import { useStoreState } from '../../store/ReactStore';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useFieldControlRegistration } from '../../internals/field/useFieldControlRegistration';
import { formatNumber } from '../../utils/formatNumber';
import { getSliderRootState } from '../store/SliderStore';
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

  const store = useSliderRootContext();

  // A thumb subscribes to its own value and the drag flag — not to the whole
  // values array. In a range slider a drag therefore re-renders only the thumb
  // being moved, instead of every thumb on the track.
  const value = useStoreState(store, 'valueByIndex', index) ?? store.context.min;
  const dragging = useStoreState(store, 'dragging');
  const labelId = useStoreState(store, 'labelId');

  const {
    direction,
    disabled,
    format,
    getAccessibilityValueText,
    locale,
    max,
    min,
    orientation,
  } = store.context;

  // The thumb is what assistive tech announces and adjusts, so a surrounding
  // field's label and messages attach here rather than to the root.
  const { fieldProps } = useFieldControlRegistration();

  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;

  // The formatted value is what a screen reader reads out; the consumer can
  // replace it, which is how the two ends of a range read differently. Without
  // `format` there is no text and React Native announces `now` instead — but a
  // consumer's callback still gets a string to build on.
  const formattedValue = formatValue(value, format, locale);
  const valueText = getAccessibilityValueText
    ? getAccessibilityValueText(formattedValue ?? String(value), value, index)
    : formattedValue;

  // A horizontal track runs right to left under RTL, and zest positions the
  // thumb itself — so this has to flip with the direction, or the thumb would
  // travel away from the finger that is dragging it.
  const positionStyle =
    orientation === 'vertical'
      ? { position: 'absolute' as const, bottom: `${percent}%` as const }
      : direction === 'rtl'
        ? { position: 'absolute' as const, right: `${percent}%` as const }
        : { position: 'absolute' as const, left: `${percent}%` as const };

  const thumbState: SliderThumbState = { ...getSliderRootState(store), index, value, percent, dragging };

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
