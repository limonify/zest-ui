'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useControlled } from '../../hooks/useControlled';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useFieldControlRegistration } from '../../internals/field/useFieldControlRegistration';
import { clamp } from '../../utils/clamp';
import type { ZestUIComponentProps, Orientation } from '../../types';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { SliderRootContext } from './SliderRootContext';
import { useDirection, type Direction } from '../../direction-provider/DirectionContext';

/**
 * How the thumbs of a range slider behave when one is dragged into another.
 */
export type SliderThumbCollisionBehavior = 'push' | 'swap' | 'none';

/**
 * Groups all parts of the slider.
 * Renders a `<View>`.
 *
 * Drop the web-only props: `name`/`form` (React Native has no form submission),
 * `largeStep` (a PageUp/PageDown affordance), and `thumbAlignment` — the latter
 * is pure CSS inset positioning, and here the consumer places the thumb itself
 * from `state.values`.
 */
export function SliderRoot<Value extends number | readonly number[] = number>(
  componentProps: SliderRoot.Props<Value>,
) {
  const {
    className,
    defaultValue,
    disabled: disabledProp = false,
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
    thumbCollisionBehavior = 'push',
    value,
    ref,
    ...elementProps
  } = componentProps;

  const { fieldDisabled, markChanged, markTouched } = useFieldControlRegistration({
    initialValue: defaultValue ?? value,
    ownsValue: true,
  });

  const disabled = disabledProp || fieldDisabled;

  const direction = useDirection();
  const rtl = direction === 'rtl';

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
    // A vertical slider grows upwards, so its position axis is inverted — and so
    // is a horizontal one under RTL, where the track runs right to left. React
    // Native mirrors the layout, but the touch coordinate it reports is still
    // measured from the control's leading edge, so the value has to be flipped
    // here rather than left to the platform.
    const inverted = orientation === 'vertical' || (orientation === 'horizontal' && rtl);
    const percent = inverted ? 1 - ratio : ratio;

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
      markChanged(fromArray(nextValues, isRange));
    },
  );

  const setThumbValue = useStableCallback(
    (index: number, nextValue: number, eventDetails: SliderRoot.ChangeEventDetails): number => {
      if (disabled) {
        return index;
      }

      const current = valuesRef.current;
      const count = current.length;
      // `minStepsBetweenValues` is the gap thumbs must keep from each other.
      const gap = minStepsBetweenValues * step;

      let nextValues: number[];
      // A swap moves the dragged thumb to a different index; every other mode
      // leaves it where it was. The caller follows this so a drag keeps hold of
      // the same thumb.
      let nextIndex = index;

      if (thumbCollisionBehavior === 'push') {
        // The dragged thumb has to leave room on the track for everything it
        // pushes ahead of it, or the pushed thumbs would pile up past the end.
        const clamped = clamp(nextValue, min + gap * index, max - gap * (count - 1 - index));

        nextValues = current.slice();
        nextValues[index] = clamped;
        for (let j = index + 1; j < count; j += 1) {
          nextValues[j] = Math.max(nextValues[j]!, nextValues[j - 1]! + gap);
        }
        for (let j = index - 1; j >= 0; j -= 1) {
          nextValues[j] = Math.min(nextValues[j]!, nextValues[j + 1]! - gap);
        }
      } else if (thumbCollisionBehavior === 'swap') {
        const clamped = clamp(nextValue, min, max);

        // The values array is always sorted, so where the dragged value belongs
        // among the others *is* the swap: it takes that index and everything it
        // passed shifts by one. The gap is not enforced here — thumbs that are
        // allowed to pass each other cannot be held apart while they do it.
        const others = current.filter((_, j) => j !== index);
        nextIndex = others.filter((other) => other < clamped).length;
        nextValues = [...others.slice(0, nextIndex), clamped, ...others.slice(nextIndex)];
      } else {
        // `'none'`: a thumb stops at its neighbour, and the excess is dropped.
        const lowerBound = index > 0 ? current[index - 1]! + gap : min;
        const upperBound = index < count - 1 ? current[index + 1]! - gap : max;
        const clamped = clamp(nextValue, lowerBound, upperBound);

        nextValues = current.slice();
        nextValues[index] = clamped;
      }

      if (
        nextValues.length === current.length &&
        nextValues.every((next, i) => next === current[i])
      ) {
        return nextIndex;
      }

      emit(nextValues, eventDetails);

      return nextIndex;
    },
  );

  const commitValue = useStableCallback((eventDetails: SliderRoot.ChangeEventDetails) => {
    onValueCommitted?.(fromArray(valuesRef.current, isRange) as Value, eventDetails);
    // Releasing the thumb is the end of the interaction — a slider's blur.
    markTouched(fromArray(valuesRef.current, isRange));
  });

  const state: SliderRootState = React.useMemo(
    () => ({ direction, disabled, dragging, max, min, orientation, values }),
    [direction, disabled, dragging, max, min, orientation, values],
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
   * The writing direction the slider is laid out for. A horizontal slider runs
   * right to left under `'rtl'`, so position your thumb and indicator from the
   * track's *start* — React Native's direction-aware `start` style prop does
   * this for you, and `left` does not.
   */
  direction: Direction;
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
   * How the thumbs of a range slider behave when one is dragged into another.
   *
   * - `'push'`: the dragged thumb pushes the ones in its way along the track.
   * - `'swap'`: thumbs trade places when one is dragged past another.
   *   `minStepsBetweenValues` is not enforced while they cross — thumbs allowed
   *   to pass each other cannot be held apart while they do it.
   * - `'none'`: a thumb stops at its neighbour and the excess movement is
   *   dropped.
   *
   * @default 'push'
   */
  thumbCollisionBehavior?: SliderThumbCollisionBehavior | undefined;
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
