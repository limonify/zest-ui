'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useControlled } from '../hooks/useControlled';
import { useStableCallback } from '../hooks/useStableCallback';
import { useRenderElement } from '../use-render/useRenderElement';
import type { BaseUIComponentProps } from '../types';
import type { ZestChangeEventDetails } from '../utils/createChangeEventDetails';
import { REASONS } from '../utils/reasons';
import { CheckboxGroupContext } from './CheckboxGroupContext';
import { useCheckboxGroupParent } from './useCheckboxGroupParent';

const EMPTY_ARRAY: never[] = [];

/**
 * Provides a shared state to a series of checkboxes.
 * Renders a `<View>`.
 */
export function CheckboxGroup(componentProps: CheckboxGroup.Props) {
  const {
    allValues,
    className,
    defaultValue: defaultValueProp,
    disabled = false,
    onValueChange,
    render,
    style,
    value: valueProp,
    ref,
    ...elementProps
  } = componentProps;

  const defaultValue =
    valueProp === undefined ? (defaultValueProp ?? (EMPTY_ARRAY as string[])) : undefined;

  const [value, setValueUnwrapped] = useControlled<string[]>({
    controlled: valueProp,
    default: defaultValue,
    name: 'CheckboxGroup',
    state: 'value',
  });

  const setValue = useStableCallback((v: string[], eventDetails: CheckboxGroup.ChangeEventDetails) => {
    onValueChange?.(v, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    setValueUnwrapped(v);
  });

  const parent = useCheckboxGroupParent({ allValues, value, onValueChange: setValue });

  const state: CheckboxGroupState = { disabled };

  const contextValue: CheckboxGroupContext = React.useMemo(
    () => ({
      allValues,
      value,
      defaultValue,
      setValue,
      parent,
      disabled,
    }),
    [allValues, value, defaultValue, setValue, parent, disabled],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        role: 'group' as const,
        accessibilityState: { disabled: disabled || undefined },
      },
      elementProps,
    ],
  });

  return <CheckboxGroupContext.Provider value={contextValue}>{element}</CheckboxGroupContext.Provider>;
}

export interface CheckboxGroupState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface CheckboxGroupProps
  extends Omit<BaseUIComponentProps<typeof View, CheckboxGroupState>, 'value'> {
  /**
   * Names of the checkboxes in the group that should be ticked.
   *
   * To render an uncontrolled checkbox group, use the `defaultValue` prop instead.
   */
  value?: string[] | undefined;
  /**
   * Names of the checkboxes in the group that should be initially ticked.
   *
   * To render a controlled checkbox group, use the `value` prop instead.
   */
  defaultValue?: string[] | undefined;
  /**
   * Event handler called when a checkbox in the group is ticked or unticked.
   * Provides the new value as an argument.
   */
  onValueChange?:
    | ((value: string[], eventDetails: CheckboxGroup.ChangeEventDetails) => void)
    | undefined;
  /**
   * Names of all checkboxes in the group. Use this when creating a parent checkbox.
   */
  allValues?: string[] | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export type CheckboxGroupChangeEventReason = typeof REASONS.none;

export type CheckboxGroupChangeEventDetails =
  ZestChangeEventDetails<CheckboxGroupChangeEventReason>;

export namespace CheckboxGroup {
  export type State = CheckboxGroupState;
  export type Props = CheckboxGroupProps;
  export type ChangeEventReason = CheckboxGroupChangeEventReason;
  export type ChangeEventDetails = CheckboxGroupChangeEventDetails;
}
