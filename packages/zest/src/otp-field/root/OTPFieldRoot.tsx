'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useControlled } from '../../hooks/useControlled';
import { useId } from '../../hooks/useId';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useRenderElement } from '../../use-render/useRenderElement';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { BaseUIComponentProps } from '../../types';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import {
  getOTPValidationConfig,
  normalizeOTPValue,
  normalizeOTPValueWithDetails,
  type OTPValidationType,
} from '../utils/otp';
import { OTPFieldRootContext } from './OTPFieldRootContext';

/**
 * Groups all parts of the OTP field.
 * Renders a `<View>`.
 *
 * **Not ported from upstream.** `name`/`form`/`required`/`autoSubmit` (the hidden
 * input and form submission — see the standing decision in CLAUDE.md), and
 * `pattern`, which is HTML constraint validation.
 */
export function OTPFieldRoot(componentProps: OTPFieldRoot.Props) {
  const {
    autoComplete = 'one-time-code',
    className,
    defaultValue,
    disabled = false,
    id: idProp,
    length,
    mask = false,
    normalizeValue,
    onValueChange,
    onValueComplete,
    onValueInvalid,
    readOnly = false,
    render,
    style,
    validationType = 'numeric',
    value: valueProp,
    ref,
    ...elementProps
  } = componentProps;

  const id = useId(idProp);

  const [value, setValueState] = useControlled<string>({
    controlled:
      valueProp === undefined
        ? undefined
        : normalizeOTPValue(valueProp, length, validationType, normalizeValue),
    default: normalizeOTPValue(defaultValue, length, validationType, normalizeValue),
    name: 'OTPField',
    state: 'value',
  });

  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [, setMap] = React.useState(() => new Map());

  const inputsRef = React.useRef(new Map<number, { focus: () => void }>());

  const registerInput = useStableCallback((index: number, node: { focus: () => void } | null) => {
    if (node) {
      inputsRef.current.set(index, node);
    } else {
      inputsRef.current.delete(index);
    }
  });

  const focusInput = useStableCallback((index: number) => {
    inputsRef.current.get(Math.min(Math.max(index, 0), length - 1))?.focus();
  });

  const reportValueInvalid = useStableCallback(
    (invalidValue: string, eventDetails: OTPFieldRoot.InvalidEventDetails) => {
      onValueInvalid?.(invalidValue, eventDetails);
    },
  );

  const setValue = useStableCallback(
    (nextValue: string, eventDetails: OTPFieldRoot.ChangeEventDetails) => {
      const [normalized] = normalizeOTPValueWithDetails(
        nextValue,
        length,
        validationType,
        normalizeValue,
      );

      if (normalized === value) {
        return normalized;
      }

      onValueChange?.(normalized, eventDetails);

      if (eventDetails.isCanceled) {
        return null;
      }

      setValueState(normalized);

      if (normalized.length === length) {
        onValueComplete?.(normalized, createChangeEventDetails(eventDetails.reason));
      }

      return normalized;
    },
  );

  const state: OTPFieldRootState = React.useMemo(
    () => ({
      disabled,
      readOnly,
      value,
      length,
      mask,
      complete: value.length === length,
      activeIndex,
    }),
    [disabled, readOnly, value, length, mask, activeIndex],
  );

  const contextValue: OTPFieldRootContext = React.useMemo(
    () => ({
      state,
      value,
      length,
      mask,
      disabled,
      readOnly,
      autoComplete,
      keyboardType: getOTPValidationConfig(validationType)?.inputMode === 'numeric'
        ? 'number-pad'
        : 'default',
      activeIndex,
      setActiveIndex,
      validationType,
      normalizeValue,
      id,
      registerInput,
      focusInput,
      reportValueInvalid,
      setValue,
    }),
    [
      state,
      value,
      length,
      mask,
      disabled,
      readOnly,
      autoComplete,
      validationType,
      activeIndex,
      normalizeValue,
      id,
      registerInput,
      focusInput,
      reportValueInvalid,
      setValue,
    ],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });

  return (
    <OTPFieldRootContext.Provider value={contextValue}>
      <CompositeList onMapChange={setMap}>{element}</CompositeList>
    </OTPFieldRootContext.Provider>
  );
}

export interface OTPFieldRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the user should be unable to change the field value.
   */
  readOnly: boolean;
  /**
   * The current OTP value.
   */
  value: string;
  /**
   * The number of slots.
   */
  length: number;
  /**
   * Whether the slots mask their characters.
   */
  mask: boolean;
  /**
   * Whether every slot is filled.
   */
  complete: boolean;
  /**
   * The slot that currently has focus, or `-1` when none does.
   */
  activeIndex: number;
}

export interface OTPFieldRootProps
  extends Omit<BaseUIComponentProps<typeof View, OTPFieldRootState>, 'id'> {
  /**
   * The number of OTP input slots.
   */
  length: number;
  /**
   * The OTP value.
   */
  value?: string | undefined;
  /**
   * The uncontrolled OTP value when the component is initially rendered.
   */
  defaultValue?: string | undefined;
  /**
   * The id of the first input. Subsequent inputs derive theirs from it
   * (`{id}-2`, `{id}-3`, and so on).
   */
  id?: string | undefined;
  /**
   * The autofill hint applied to the first slot. `'one-time-code'` is what lets
   * the OS offer a code it read from an SMS.
   * @default 'one-time-code'
   */
  autoComplete?: string | undefined;
  /**
   * Whether the slots should mask entered characters.
   * @default false
   */
  mask?: boolean | undefined;
  /**
   * The type of validation applied to the OTP value.
   * @default 'numeric'
   */
  validationType?: OTPValidationType | undefined;
  /**
   * Normalizes the OTP value after whitespace and `validationType` filtering.
   * It must be idempotent: the same value may be normalized more than once.
   */
  normalizeValue?: ((value: string) => string) | undefined;
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
   * Callback fired when the OTP value changes.
   */
  onValueChange?:
    | ((value: string, eventDetails: OTPFieldRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Callback fired when entered text contains characters rejected by validation
   * or normalization. The `value` argument is what the user attempted to enter,
   * before normalization.
   */
  onValueInvalid?:
    | ((value: string, eventDetails: OTPFieldRoot.InvalidEventDetails) => void)
    | undefined;
  /**
   * Callback fired when the OTP value becomes complete.
   */
  onValueComplete?:
    | ((value: string, eventDetails: OTPFieldRoot.CompleteEventDetails) => void)
    | undefined;
}

export type OTPFieldRootChangeEventReason =
  | typeof REASONS.inputChange
  | typeof REASONS.inputClear
  | typeof REASONS.none;

export type OTPFieldRootChangeEventDetails = ZestChangeEventDetails<OTPFieldRootChangeEventReason>;

export namespace OTPFieldRoot {
  export type State = OTPFieldRootState;
  export type Props = OTPFieldRootProps;
  export type ValidationType = OTPValidationType;
  export type ChangeEventReason = OTPFieldRootChangeEventReason;
  export type ChangeEventDetails = OTPFieldRootChangeEventDetails;
  export type InvalidEventDetails = OTPFieldRootChangeEventDetails;
  export type CompleteEventDetails = OTPFieldRootChangeEventDetails;
}
