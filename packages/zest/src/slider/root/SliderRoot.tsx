'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useControlled } from '../../hooks/useControlled';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useRenderElement } from '../../use-render/useRenderElement';
import { clamp } from '../../utils/clamp';
import type { ZestUIComponentProps, Orientation } from '../../types';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { SliderRootContext } from './SliderRootContext';

/**
 * Groups all parts of the slider.
 * Renders a `<View>`.
 *
 * Drop the web-only props: `name`/`form` (React Native has no form submission),
 * `largeStep` (a PageUp/PageDown affordance), and `thumbAlignment` (CSS).
 */
export function SliderRoot<Value extends number | readonly number[] = number>(
  componentProps: SliderRoot.Props<Value>,
) {
  const {
    className,
    defaultValue,
    disabled = false,
    format,
    locale,
    max = 100,
    min = 0,
    minStepsBetweenValues = 0,
    onValueChange,
    onValueCommitted,
    orientation = 'horizontal',
    render,
    step = 1,
    style,
    value,
    ref,
    ...elementProps
  } = componentProps;

  // A range slider is just a slider whose value is an array; remember which
  // shape the consumer used so callbacks hand back the same one.
  const isRange = Array.isArray(value ?? defaultValue);

  const controlledValues = React.useMemo(
    () => (value === undefined ? undefined : toArray(value)),
    [value],
  );
  const defaultValues = React.useMemo(
    () => (value !== undefined ? undefined : toArray(defaultValue ?? (min as Value))),
    [value, defaultValue, min],
  );

  const [values, setValuesState] = useControlled<readonly number[]>({
    controlled: controlledValues,
    default: defaultValues,
    name: 'Slider',
    state: 'value',
  });

  const [dragging, setDragging] = React.useState(false);
  const [controlSize, setControlSize] = React.useState<number | undefined>(undefined);
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);

  // A drag emits several changes in one synchronous batch — its final move and
  // its finalize land before React re-renders — so the value logic cannot read
  // `values` from render or it would work against the previous batch's state.
  // The effect has no dependency array on purpose: it must also resync when a
  // controlled consumer ignores a change, which re-renders nothing.
  const valuesRef = React.useRef(values);
  useIsoLayoutEffect(() => {
    valuesRef.current = values;
  });

  const roundToStep = useStableCallback((raw: number) => {
    const stepped = Math.round((raw - min) / step) * step + min;
    // Steps like 0.1 accumulate float error; round to the step's precision.
    const decimals = countDecimals(step);
    const rounded = Number(stepped.toFixed(decimals));
    return clamp(rounded, min, max);
  });

  const getValueFromPosition = useStableCallback((position: number) => {
    // Nothing can be derived from a position until the control has reported its
    // size; callers must bail rather than fall back to a value, or a touch
    // landing before the first layout would snap the slider to `min`.
    if (!controlSize) {
      return undefined;
    }

    const ratio = clamp(position / controlSize, 0, 1);
    // A vertical slider grows upwards, so its position axis is inverted.
    const percent = orientation === 'vertical' ? 1 - ratio : ratio;

    return roundToStep(min + percent * (max - min));
  });

  const getClosestThumbIndex = useStableCallback((target: number) => {
    let closest = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    valuesRef.current.forEach((thumbValue, index) => {
      const distance = Math.abs(thumbValue - target);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closest = index;
      }
    });

    return closest;
  });

  const emit = useStableCallback(
    (nextValues: readonly number[], eventDetails: SliderRoot.ChangeEventDetails) => {
      onValueChange?.(fromArray(nextValues, isRange) as Value, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      valuesRef.current = nextValues;
      setValuesState(nextValues);
    },
  );

  const setThumbValue = useStableCallback(
    (index: number, nextValue: number, eventDetails: SliderRoot.ChangeEventDetails) => {
      if (disabled) {
        return;
      }

      const current = valuesRef.current;

      // Thumbs may not cross, and `minStepsBetweenValues` keeps a gap between them.
      const gap = minStepsBetweenValues * step;
      const lowerBound = index > 0 ? current[index - 1]! + gap : min;
      const upperBound = index < current.length - 1 ? current[index + 1]! - gap : max;

      const clamped = clamp(nextValue, lowerBound, upperBound);

      if (clamped === current[index]) {
        return;
      }

      const nextValues = current.slice();
      nextValues[index] = clamped;

      emit(nextValues, eventDetails);
    },
  );

  const commitValue = useStableCallback((eventDetails: SliderRoot.ChangeEventDetails) => {
    onValueCommitted?.(fromArray(valuesRef.current, isRange) as Value, eventDetails);
  });

  const state: SliderRootState = React.useMemo(
    () => ({ disabled, dragging, max, min, orientation, values }),
    [disabled, dragging, max, min, orientation, values],
  );

  const contextValue: SliderRootContext = React.useMemo(
    () => ({
      commitValue,
      controlSize,
      disabled,
      dragging,
      format,
      getClosestThumbIndex,
      getValueFromPosition,
      labelId,
      locale,
      max,
      min,
      orientation,
      setControlSize,
      setDragging,
      setLabelId,
      setThumbValue,
      state,
      step,
      values,
    }),
    [
      commitValue,
      controlSize,
      disabled,
      dragging,
      format,
      getClosestThumbIndex,
      getValueFromPosition,
      labelId,
      locale,
      max,
      min,
      orientation,
      setThumbValue,
      state,
      step,
      values,
    ],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [{ 'aria-orientation': orientation }, elementProps],
  });

  return <SliderRootContext.Provider value={contextValue}>{element}</SliderRootContext.Provider>;
}

function toArray(value: number | readonly number[]): readonly number[] {
  return Array.isArray(value) ? value : [value as number];
}

function fromArray(values: readonly number[], isRange: boolean): number | readonly number[] {
  return isRange ? values : values[0]!;
}

function countDecimals(value: number) {
  const text = String(value);
  const separator = text.indexOf('.');
  return separator === -1 ? 0 : text.length - separator - 1;
}

export interface SliderRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether a thumb is currently being dragged.
   */
  dragging: boolean;
  /**
   * The maximum allowed value.
   */
  max: number;
  /**
   * The minimum allowed value.
   */
  min: number;
  /**
   * The component orientation.
   */
  orientation: Orientation;
  /**
   * The current value of every thumb.
   */
  values: readonly number[];
}

export interface SliderRootProps<Value extends number | readonly number[] = number>
  extends Omit<ZestUIComponentProps<typeof View, SliderRootState>, 'value'> {
  /**
   * The value of the slider. Pass an array for a range slider.
   *
   * To render an uncontrolled slider, use the `defaultValue` prop instead.
   */
  value?: Value | undefined;
  /**
   * The initial value of the slider.
   *
   * To render a controlled slider, use the `value` prop instead.
   */
  defaultValue?: Value | undefined;
  /**
   * Event handler called while a thumb is being dragged.
   */
  onValueChange?: ((value: Value, eventDetails: SliderRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Event handler called once the drag ends.
   */
  onValueCommitted?:
    | ((value: Value, eventDetails: SliderRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * The minimum allowed value.
   * @default 0
   */
  min?: number | undefined;
  /**
   * The maximum allowed value.
   * @default 100
   */
  max?: number | undefined;
  /**
   * The granularity the value must adhere to.
   * @default 1
   */
  step?: number | undefined;
  /**
   * The minimum number of steps to keep between the thumbs of a range slider.
   * @default 0
   */
  minStepsBetweenValues?: number | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
  /**
   * Options for formatting the value in `Slider.Value`.
   */
  format?: Intl.NumberFormatOptions | undefined;
  /**
   * The locale used to format the value in `Slider.Value`.
   */
  locale?: Intl.LocalesArgument | undefined;
}

export type SliderRootChangeEventReason = typeof REASONS.drag | typeof REASONS.none;

export type SliderRootChangeEventDetails = ZestChangeEventDetails<SliderRootChangeEventReason>;

export namespace SliderRoot {
  export type State = SliderRootState;
  export type Props<Value extends number | readonly number[] = number> = SliderRootProps<Value>;
  export type ChangeEventReason = SliderRootChangeEventReason;
  export type ChangeEventDetails = SliderRootChangeEventDetails;
}
