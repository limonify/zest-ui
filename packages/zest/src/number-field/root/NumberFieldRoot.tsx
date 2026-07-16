'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useControlled } from '../../hooks/useControlled';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useRenderElement } from '../../use-render/useRenderElement';
import { formatNumber } from '../../utils/formatNumber';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { toValidatedNumber } from '../utils/validate';
import {
  NumberFieldRootContext,
  type NumberFieldIncrementParameters,
} from './NumberFieldRootContext';

/**
 * Groups all parts of the number field.
 * Renders a `<View>`.
 *
 * **Not ported from upstream.** `name`/`form`/`required`/`inputRef` (the hidden
 * input and form submission — see the standing decision in CLAUDE.md);
 * `allowWheelScrub` (no mouse wheel); and `smallStep`/`largeStep`, which upstream
 * steps by while the alt/shift key is held — a touch keyboard has neither, the
 * same reason `Slider` drops `largeStep`. Arrow-key stepping and the
 * `input-paste` reason go with them: React Native's `TextInput` reports edits
 * through `onChangeText`, which cannot tell a paste from typing.
 */
export function NumberFieldRoot(componentProps: NumberFieldRoot.Props) {
  const {
    allowOutOfRange = false,
    className,
    defaultValue,
    disabled = false,
    format,
    id,
    locale,
    max,
    min,
    onValueChange,
    onValueCommitted,
    readOnly = false,
    render,
    snapOnStep = false,
    step = 1,
    style,
    value: valueProp,
    ref,
    ...elementProps
  } = componentProps;

  const minWithDefault = min ?? Number.MIN_SAFE_INTEGER;
  const maxWithDefault = max ?? Number.MAX_SAFE_INTEGER;
  // Seeding an empty field steps from 0, but 0 may be out of range.
  const minWithZeroDefault = min ?? 0;

  const [value, setValueState] = useControlled<number | null>({
    controlled: valueProp,
    default: defaultValue ?? null,
    name: 'NumberField',
    state: 'value',
  });

  const [inputValue, setInputValue] = React.useState(() => formatNumber(value, locale, format));
  const [scrubbing, setScrubbing] = React.useState(false);

  const valueRef = React.useRef(value);
  const lastChangedValueRef = React.useRef<number | null>(null);
  const formatOptionsRef = React.useRef(format);
  // False while the user is typing, so their text is not reformatted underneath
  // them until blur.
  const allowInputSyncRef = React.useRef(true);

  useIsoLayoutEffect(() => {
    valueRef.current = value;
    formatOptionsRef.current = format;
  });

  // A controlled value changing from outside must be reflected in the text, but
  // not while the user is mid-edit.
  useIsoLayoutEffect(() => {
    if (allowInputSyncRef.current) {
      setInputValue(formatNumber(value, locale, format));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, locale, JSON.stringify(format)]);

  const getStepAmount = useStableCallback(() => (step === 'any' ? 1 : step));

  const setValue = useStableCallback(
    (unvalidatedValue: number | null, eventDetails: NumberFieldRoot.ChangeEventDetails) => {
      const direction = eventDetails.direction;

      // Direct text entry behaves natively; step-based interactions (buttons,
      // scrub) do not. Every direct-entry reason shares the `input-` prefix.
      const isInputReason =
        eventDetails.reason.startsWith('input-') || eventDetails.reason === 'none';
      const shouldClampValue = !allowOutOfRange || !isInputReason;

      const validatedValue = toValidatedNumber(
        unvalidatedValue,
        direction ? getStepAmount() * direction : undefined,
        minWithDefault,
        maxWithDefault,
        minWithZeroDefault,
        formatOptionsRef.current,
        snapOnStep,
        // Upstream passes `altKey` here to snap to `smallStep`; there is no alt
        // key on a touch keyboard, so it is always false.
        false,
        shouldClampValue,
      );

      // Fire even when the number is unchanged for input reasons: the typed text
      // may clamp or snap back to the current value, and the consumer still needs
      // to know the text was rejected.
      const shouldFireChange =
        validatedValue !== valueRef.current ||
        (isInputReason &&
          (unvalidatedValue !== valueRef.current || allowInputSyncRef.current === false));

      if (shouldFireChange) {
        onValueChange?.(validatedValue, eventDetails);

        if (eventDetails.isCanceled) {
          return false;
        }

        valueRef.current = validatedValue;
        setValueState(validatedValue);
      }

      lastChangedValueRef.current = validatedValue;

      if (allowInputSyncRef.current) {
        setInputValue(formatNumber(validatedValue, locale, format));
      }

      return shouldFireChange;
    },
  );

  const incrementValue = useStableCallback(
    (amount: number, { direction, currentValue, reason }: NumberFieldIncrementParameters) => {
      const previousValue = currentValue === undefined ? valueRef.current : currentValue;

      if (typeof previousValue !== 'number') {
        // Seed an empty field with 0; `setValue` clamps it to the in-range value
        // nearest 0 (e.g. `max` for a negative range). No `direction`: the seed
        // is not a step, so it must not be directionally snapped.
        return setValue(0, createChangeEventDetails(reason));
      }

      return setValue(
        previousValue + amount * direction,
        createChangeEventDetails(reason, undefined, { direction }),
      );
    },
  );

  const handleValueCommitted = useStableCallback(
    (committedValue: number | null, eventDetails: NumberFieldRoot.ChangeEventDetails) => {
      onValueCommitted?.(committedValue, eventDetails);
    },
  );

  const state: NumberFieldRootState = React.useMemo(
    () => ({
      disabled,
      readOnly,
      required: false,
      scrubbing,
      value,
      inputValue,
      min,
      max,
    }),
    [disabled, readOnly, scrubbing, value, inputValue, min, max],
  );

  const contextValue: NumberFieldRootContext = React.useMemo(
    () => ({
      state,
      id,
      min,
      max,
      minWithDefault,
      maxWithDefault,
      locale,
      setValue,
      incrementValue,
      getStepAmount,
      setInputValue,
      setScrubbing,
      allowInputSyncRef,
      valueRef,
      lastChangedValueRef,
      formatOptionsRef,
      onValueCommitted: handleValueCommitted,
    }),
    [
      state,
      id,
      min,
      max,
      minWithDefault,
      maxWithDefault,
      locale,
      setValue,
      incrementValue,
      getStepAmount,
      handleValueCommitted,
    ],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });

  return (
    <NumberFieldRootContext.Provider value={contextValue}>{element}</NumberFieldRootContext.Provider>
  );
}

export interface NumberFieldRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the user should be unable to change the field value.
   */
  readOnly: boolean;
  /**
   * Whether the user must enter a value.
   */
  required: boolean;
  /**
   * Whether the value is being changed by dragging the scrub area.
   */
  scrubbing: boolean;
  /**
   * The raw numeric value of the field.
   */
  value: number | null;
  /**
   * The text currently shown in the input.
   */
  inputValue: string;
  /**
   * The minimum value of the field.
   */
  min: number | undefined;
  /**
   * The maximum value of the field.
   */
  max: number | undefined;
}

export interface NumberFieldRootProps
  extends Omit<ZestUIComponentProps<typeof View, NumberFieldRootState>, 'id'> {
  /**
   * The raw numeric value of the field.
   */
  value?: number | null | undefined;
  /**
   * The uncontrolled value of the field when it's initially rendered.
   *
   * To render a controlled number field, use the `value` prop instead.
   */
  defaultValue?: number | undefined;
  /**
   * The id of the input element.
   */
  id?: string | undefined;
  /**
   * The minimum value of the field.
   */
  min?: number | undefined;
  /**
   * The maximum value of the field.
   */
  max?: number | undefined;
  /**
   * Amount to increment and decrement with the buttons, or to scrub with a drag
   * in the scrub area.
   *
   * Specify `step="any"` to disable step validation; stepping then uses 1.
   * @default 1
   */
  step?: number | 'any' | undefined;
  /**
   * Whether the value should snap to the nearest step when incrementing or
   * decrementing.
   * @default false
   */
  snapOnStep?: boolean | undefined;
  /**
   * When true, typed text may fall outside the `min`/`max` range without
   * clamping. Step-based interactions (buttons, scrub) still clamp.
   * @default false
   */
  allowOutOfRange?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the user should be unable to change the field value.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Options to format the input value.
   */
  format?: Intl.NumberFormatOptions | undefined;
  /**
   * The locale of the input element.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * Callback fired when the number value changes.
   */
  onValueChange?:
    | ((value: number | null, eventDetails: NumberFieldRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Callback fired when the value is committed: when the input is blurred after
   * typing, or the press is released after scrubbing or stepping.
   */
  onValueCommitted?:
    | ((value: number | null, eventDetails: NumberFieldRoot.ChangeEventDetails) => void)
    | undefined;
}

export type NumberFieldRootChangeEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.inputClear
  | typeof REASONS.inputBlur
  | typeof REASONS.incrementPress
  | typeof REASONS.decrementPress
  | typeof REASONS.scrub
  | typeof REASONS.none;

export type NumberFieldRootChangeEventDetails = ZestChangeEventDetails<
  NumberFieldRootChangeEventReason,
  {
    /**
     * Which way a step went, when the change was a step. Absent for direct text
     * entry, which must not be directionally snapped.
     */
    direction?: 1 | -1 | undefined;
  }
>;

export namespace NumberFieldRoot {
  export type State = NumberFieldRootState;
  export type Props = NumberFieldRootProps;
  export type ChangeEventReason = NumberFieldRootChangeEventReason;
  export type ChangeEventDetails = NumberFieldRootChangeEventDetails;
}
