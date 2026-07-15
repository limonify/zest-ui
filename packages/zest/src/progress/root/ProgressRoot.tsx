'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { clamp } from '../../utils/clamp';
import { formatNumber } from '../../utils/formatNumber';
import type { BaseUIComponentProps } from '../../types';
import { ProgressRootContext } from './ProgressRootContext';

function getDefaultAccessibilityValueText(formattedValue: string | null, value: number | null) {
  if (value == null) {
    return 'indeterminate progress';
  }

  return formattedValue ?? '';
}

/**
 * Groups all parts of the progress bar and provides the task completion status
 * to screen readers.
 * Renders a `<View>`.
 *
 * **Not ported from upstream.** The visually-hidden `<span>` holding an `x`:
 * it is a workaround for NVDA not reading the label, and NVDA is a Windows
 * screen reader.
 */
export function ProgressRoot(componentProps: ProgressRoot.Props) {
  const {
    className,
    format,
    getAccessibilityValueText = getDefaultAccessibilityValueText,
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

  // `value === null` (or any non-finite value) keeps Progress indeterminate.
  // Otherwise one clamped value and one normalized percentage keep the status,
  // the accessibility value, the formatted text and the indicator's width in
  // sync for any min/max — not just the default 0–100.
  let status: ProgressStatus = 'indeterminate';
  let percentageValue: number | null = null;
  let clampedValue: number | null = null;
  let formattedValue = '';

  if (value != null && Number.isFinite(value)) {
    const rawPercentage = valueToPercent(value, min, max);
    percentageValue = clamp(Number.isNaN(rawPercentage) ? 0 : rawPercentage, 0, 100);
    clampedValue = clamp(value, min, max);
    status = clampedValue === max ? 'complete' : 'progressing';
    // Without an explicit `format` the value reads as its position in the range,
    // so the text stays in sync with the indicator fill.
    formattedValue = format
      ? formatNumber(value, locale, format)
      : formatNumber(percentageValue / 100, locale, { style: 'percent' });
  }

  const state: ProgressRootState = React.useMemo(() => ({ status }), [status]);

  const contextValue: ProgressRootContext = React.useMemo(
    () => ({ formattedValue, percentageValue, setLabelId, state, value }),
    [formattedValue, percentageValue, state, value],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityRole: 'progressbar' as const,
        accessibilityLabelledBy: labelId,
        accessibilityValue: {
          min,
          max,
          now: clampedValue ?? undefined,
          text: getAccessibilityValueText(formattedValue, value),
        },
        'aria-labelledby': labelId,
      },
      elementProps,
    ],
  });

  return <ProgressRootContext.Provider value={contextValue}>{element}</ProgressRootContext.Provider>;
}

function valueToPercent(value: number, min: number, max: number) {
  return ((value - min) * 100) / (max - min);
}

export type ProgressStatus = 'indeterminate' | 'progressing' | 'complete';

export interface ProgressRootState {
  /**
   * The current status.
   */
  status: ProgressStatus;
}

export interface ProgressRootProps extends BaseUIComponentProps<typeof View, ProgressRootState> {
  /**
   * The current value. The component is indeterminate when value is `null`.
   */
  value: number | null;
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
   *
   * Renamed from upstream's `getAriaValueText`: on React Native this feeds
   * `accessibilityValue.text`, not `aria-valuetext`.
   */
  getAccessibilityValueText?:
    | ((formattedValue: string | null, value: number | null) => string)
    | undefined;
}

export namespace ProgressRoot {
  export type State = ProgressRootState;
  export type Props = ProgressRootProps;
  export type Status = ProgressStatus;
}
