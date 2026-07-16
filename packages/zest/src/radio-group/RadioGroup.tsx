'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useControlled } from '../hooks/useControlled';
import { useStableCallback } from '../hooks/useStableCallback';
import { useRenderElement } from '../use-render/useRenderElement';
import { useFieldControlRegistration } from '../internals/field/useFieldControlRegistration';
import type { ZestUIComponentProps } from '../types';
import type { ZestChangeEventDetails } from '../utils/createChangeEventDetails';
import { REASONS } from '../utils/reasons';
import { RadioGroupContext } from './RadioGroupContext';

/**
 * Provides a shared state to a series of radio buttons.
 * Renders a `<View>`.
 */
export function RadioGroup<Value = any>(componentProps: RadioGroup.Props<Value>) {
  const {
    className,
    defaultValue,
    disabled: disabledProp = false,
    onValueChange,
    readOnly = false,
    render,
    required = false,
    style,
    value: valueProp,
    ref,
    ...elementProps
  } = componentProps;

  const { fieldDisabled, fieldProps, validateField } = useFieldControlRegistration();

  const disabled = disabledProp || fieldDisabled;

  const [checkedValue, setCheckedValueUnwrapped] = useControlled<Value | undefined>({
    controlled: valueProp,
    default: defaultValue,
    name: 'RadioGroup',
    state: 'value',
  });

  const setCheckedValue = useStableCallback(
    (value: Value, eventDetails: RadioGroup.ChangeEventDetails) => {
      onValueChange?.(value, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setCheckedValueUnwrapped(value);
      validateField(value);
    },
  );

  const state: RadioGroupState = { disabled, readOnly, required };

  const contextValue: RadioGroupContext<Value> = React.useMemo(
    () => ({
      checkedValue,
      setCheckedValue,
      disabled,
      readOnly,
      required,
    }),
    [checkedValue, setCheckedValue, disabled, readOnly, required],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityRole: 'radiogroup' as const,
        accessibilityState: { disabled: disabled || undefined },
        'aria-required': required || undefined,
        'aria-readonly': readOnly || undefined,
        ...fieldProps,
      },
      elementProps,
    ],
  });

  return <RadioGroupContext.Provider value={contextValue}>{element}</RadioGroupContext.Provider>;
}

export interface RadioGroupState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the user should be unable to select a different radio button in the group.
   */
  readOnly: boolean;
  /**
   * Whether the user must choose a value before submitting a form.
   */
  required: boolean;
}

export interface RadioGroupProps<Value = any>
  extends Omit<ZestUIComponentProps<typeof View, RadioGroupState>, 'value'> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the user should be unable to select a different radio button in the group.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * The controlled value of the radio item that should be currently selected.
   *
   * To render an uncontrolled radio group, use the `defaultValue` prop instead.
   */
  value?: Value | undefined;
  /**
   * The uncontrolled value of the radio button that should be initially selected.
   *
   * To render a controlled radio group, use the `value` prop instead.
   */
  defaultValue?: Value | undefined;
  /**
   * Callback fired when the value changes.
   */
  onValueChange?: ((value: Value, eventDetails: RadioGroup.ChangeEventDetails) => void) | undefined;
}

export type RadioGroupChangeEventReason = typeof REASONS.none;

export type RadioGroupChangeEventDetails = ZestChangeEventDetails<RadioGroupChangeEventReason>;

export namespace RadioGroup {
  export type State = RadioGroupState;
  export type Props<Value = any> = RadioGroupProps<Value>;
  export type ChangeEventReason = RadioGroupChangeEventReason;
  export type ChangeEventDetails = RadioGroupChangeEventDetails;
}
