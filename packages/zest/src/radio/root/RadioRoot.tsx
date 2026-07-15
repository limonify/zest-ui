'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useRadioGroupContext } from '../../radio-group/RadioGroupContext';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { RadioRootContext } from './RadioRootContext';

/**
 * Represents the radio button itself.
 * Renders a `<Pressable>`.
 *
 * Must be placed within a `<RadioGroup>`: unlike the web version there is no
 * hidden `<input>`, so the group is the only source of truth.
 */
export function RadioRoot<Value = any>(componentProps: RadioRoot.Props<Value>) {
  const {
    className,
    disabled: disabledProp = false,
    readOnly: readOnlyProp = false,
    render,
    required: requiredProp = false,
    style,
    value,
    ref,
    ...elementProps
  } = componentProps;

  const {
    checkedValue,
    setCheckedValue,
    disabled: disabledGroup,
    readOnly: readOnlyGroup,
    required: requiredGroup,
  } = useRadioGroupContext<Value>();

  const disabled = disabledGroup || disabledProp;
  const readOnly = readOnlyGroup || readOnlyProp;
  const required = requiredGroup || requiredProp;

  const checked = checkedValue === value;

  const { getButtonProps } = useButton({ disabled });

  const state: RadioRootState = React.useMemo(
    () => ({ checked, disabled, readOnly, required }),
    [checked, disabled, readOnly, required],
  );

  const element = useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onPress(event: GestureResponderEvent) {
          if (disabled || readOnly || value === undefined) {
            return;
          }

          setCheckedValue(value, createChangeEventDetails(REASONS.none, event));
        },
        accessibilityRole: 'radio' as const,
        accessibilityState: { checked, disabled: disabled || undefined },
        'aria-readonly': readOnly || undefined,
        'aria-required': required || undefined,
      },
      elementProps,
      getButtonProps,
    ],
  });

  return <RadioRootContext.Provider value={state}>{element}</RadioRootContext.Provider>;
}

export interface RadioRootState {
  /**
   * Whether the radio button is currently selected.
   */
  checked: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the user should be unable to select the radio button.
   */
  readOnly: boolean;
  /**
   * Whether the user must choose a value before submitting a form.
   */
  required: boolean;
}

export interface RadioRootProps<Value = any>
  extends Omit<BaseUIComponentProps<typeof Pressable, RadioRootState>, 'value' | 'onPress'> {
  /**
   * The unique identifying value of the radio in a group.
   */
  value: Value;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the user should be unable to select the radio button.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
}

export namespace RadioRoot {
  export type State = RadioRootState;
  export type Props<Value = any> = RadioRootProps<Value>;
}
