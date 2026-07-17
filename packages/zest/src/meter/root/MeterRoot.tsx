'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { clamp } from '../../utils/clamp';
import { formatNumber } from '../../utils/formatNumber';
import type { ZestUIComponentProps } from '../../types';
import { MeterRootContext } from './MeterRootContext';

/**
 * Groups all parts of the meter and announces the value to screen readers.
 * Renders a `<View>`.
 *
 * A meter is a static gauge (disk usage, battery level), unlike `Progress`
 * which tracks a task towards completion — so it has no indeterminate state and
 * no `status`. Everything else mirrors `Progress`.
 *
 * **Not ported from upstream.** The visually-hidden `<span>` holding an `x`
 * (an NVDA workaround, a Windows screen reader).
 */
export function MeterRoot(componentProps: MeterRoot.Props) {
  const {
    className,
    format,
    getAccessibilityValueText,
    locale,
    max = 100,
    min = 0,
    render,
    style,
    value,
    ref,
    ...elementProps
  } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);

  const rawPercentage = valueToPercent(value, min, max);
  const percentageValue = clamp(Number.isNaN(rawPercentage) ? 0 : rawPercentage, 0, 100);
  const clampedValue = clamp(Number.isNaN(value) ? min : value, min, max);

  // Without an explicit `format` the value reads as its position in the range,
  // so the text stays in sync with the indicator fill for any min/max.
  const formattedValue = format
    ? formatNumber(value, locale, format)
    : formatNumber(percentageValue / 100, locale, { style: 'percent' });

  const state: MeterRootState = React.useMemo(() => ({}), []);

  const contextValue: MeterRootContext = React.useMemo(
    () => ({ formattedValue, percentageValue, setLabelId, value }),
    [formattedValue, percentageValue, value],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        // React Native's `accessibilityRole` has no 'meter'; the W3C `role`
        // prop does, and 'progressbar' is the closest native fallback.
        role: 'meter' as const,
        accessibilityRole: 'progressbar' as const,
        accessibilityLabelledBy: labelId,
        accessibilityValue: {
          min,
          max,
          now: clampedValue,
          text: getAccessibilityValueText
            ? getAccessibilityValueText(formattedValue, value)
            : formattedValue,
        },
        'aria-labelledby': labelId,
      },
      elementProps,
    ],
  });

  return <MeterRootContext.Provider value={contextValue}>{element}</MeterRootContext.Provider>;
}

function valueToPercent(value: number, min: number, max: number) {
  return ((value - min) * 100) / (max - min);
}

export interface MeterRootState {}

export interface MeterRootProps extends ZestUIComponentProps<typeof View, MeterRootState> {
  /**
   * The current value.
   */
  value: number;
  /**
   * The minimum value.
   * @default 0
   */
  min?: number | undefined;
  /**
   * The maximum value.
   * @default 100
   */
  max?: number | undefined;
  /**
   * Options to format the value.
   */
  format?: Intl.NumberFormatOptions | undefined;
  /**
   * The locale used by `Intl.NumberFormat` when formatting the value.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * Returns a human-readable text alternative for the current value, announced
   * by assistive technology.
   */
  getAccessibilityValueText?: ((formattedValue: string, value: number) => string) | undefined;
}

export namespace MeterRoot {
  export type State = MeterRootState;
  export type Props = MeterRootProps;
}
