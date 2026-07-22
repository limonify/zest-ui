'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useControlled } from '../hooks/useControlled';
import { useStableCallback } from '../hooks/useStableCallback';
import { useRenderElement } from '../use-render/useRenderElement';
import type { ZestUIComponentProps, Orientation } from '../types';
import type { ZestChangeEventDetails } from '../utils/createChangeEventDetails';
import type { REASONS } from '../utils/reasons';
import { ToggleGroupContext } from './ToggleGroupContext';

const EMPTY_ARRAY: never[] = [];

/**
 * Provides a shared state to a series of toggle buttons.
 * Renders a `<View>`.
 */
export function ToggleGroup<Value extends string = string>(
  componentProps: ToggleGroup.Props<Value>,
) {
  const {
    className,
    defaultValue: defaultValueProp,
    disabled = false,
    multiple = false,
    onValueChange,
    orientation = 'horizontal',
    render,
    style,
    value: valueProp,
    ref,
    ...elementProps
  } = componentProps;

  const isValueInitialized = valueProp !== undefined || defaultValueProp !== undefined;

  const [groupValue, setValueState] = useControlled<readonly Value[]>({
    controlled: valueProp,
    default: valueProp === undefined ? (defaultValueProp ?? EMPTY_ARRAY) : undefined,
    name: 'ToggleGroup',
    state: 'value',
  });

  const setGroupValue = useStableCallback(
    (
      newValue: Value,
      nextPressed: boolean,
      eventDetails: ZestChangeEventDetails<typeof REASONS.none>,
    ) => {
      let newGroupValue: Value[];
      if (multiple) {
        newGroupValue = groupValue.slice();
        if (nextPressed) {
          newGroupValue.push(newValue);
        } else {
          newGroupValue.splice(groupValue.indexOf(newValue), 1);
        }
      } else {
        newGroupValue = nextPressed ? [newValue] : [];
      }

      onValueChange?.(newGroupValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueState(newGroupValue);
    },
  );

  const state: ToggleGroupState = React.useMemo(
    () => ({ disabled, multiple, orientation }),
    [disabled, multiple, orientation],
  );

  const contextValue: ToggleGroupContext<Value> = React.useMemo(
    () => ({
      disabled,
      setGroupValue,
      value: groupValue,
      isValueInitialized,
    }),
    [disabled, setGroupValue, groupValue, isValueInitialized],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        role: 'group' as const,
        'aria-orientation': orientation,
      },
      elementProps,
    ],
  });

  return <ToggleGroupContext.Provider value={contextValue}>{element}</ToggleGroupContext.Provider>;
}

export interface ToggleGroupState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * When `false` only one item in the group can be pressed. If any item in
   * the group becomes pressed, the others will become unpressed.
   * When `true` multiple items can be pressed.
   */
  multiple: boolean;
  /**
   * The orientation of the toggle group.
   */
  orientation: Orientation;
}

export interface ToggleGroupProps<Value extends string = string>
  extends ZestUIComponentProps<typeof View, ToggleGroupState> {
  /**
   * The pressed state of the toggle group represented by an array of
   * the values of all pressed toggle buttons.
   * This is the controlled counterpart of `defaultValue`.
   */
  value?: readonly Value[] | undefined;
  /**
   * The pressed state of the toggle group represented by an array of
   * the values of all pressed toggle buttons.
   * This is the uncontrolled counterpart of `value`.
   */
  defaultValue?: readonly Value[] | undefined;
  /**
   * Callback fired when the pressed states of the toggle group changes.
   */
  onValueChange?:
    | ((groupValue: Value[], eventDetails: ToggleGroup.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the toggle group should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * @default 'horizontal'
   */
  orientation?: Orientation | undefined;
  /**
   * When `false` only one item in the group can be pressed. If any item in
   * the group becomes pressed, the others will become unpressed.
   * When `true` multiple items can be pressed.
   * @default false
   */
  multiple?: boolean | undefined;
}

export type ToggleGroupChangeEventReason = typeof REASONS.none;

export type ToggleGroupChangeEventDetails = ZestChangeEventDetails<ToggleGroupChangeEventReason>;

export namespace ToggleGroup {
  export type State = ToggleGroupState;
  export type Props<Value extends string = string> = ToggleGroupProps<Value>;
  export type ChangeEventReason = ToggleGroupChangeEventReason;
  export type ChangeEventDetails = ToggleGroupChangeEventDetails;
}
