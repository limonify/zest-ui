'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useControlled } from '../../hooks/useControlled';
import { useId } from '../../hooks/useId';
import { useStableCallback } from '../../hooks/useStableCallback';
import type { ZestUIComponentProps } from '../../types';
import type { ZestChangeEventDetails, ZestNativeEvent } from '../../utils/createChangeEventDetails';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { MenuGroupContext } from '../group/MenuGroupContext';
import { MenuRadioGroupContext } from './MenuRadioGroupContext';

/**
 * Groups related radio items.
 * Renders a `<View>`.
 */
export function MenuRadioGroup<Value = any>(componentProps: MenuRadioGroup.Props<Value>) {
  const {
    className,
    defaultValue,
    disabled = false,
    onValueChange,
    render,
    style,
    value: valueProp,
    ref,
    ...elementProps
  } = componentProps;

  const [value, setValueState] = useControlled<Value>({
    controlled: valueProp,
    default: defaultValue as Value,
    name: 'MenuRadioGroup',
    state: 'value',
  });

  const setValue = useStableCallback((nextValue: Value, event: ZestNativeEvent) => {
    const eventDetails = createChangeEventDetails(REASONS.itemPress, event);

    onValueChange?.(nextValue, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    setValueState(nextValue);
  });

  // Like upstream, a radio group is labelable by a `Menu.GroupLabel` placed
  // inside it, so it owns a label id and provides the group context the label
  // reads — the same shape `Menu.Group` provides.
  const labelId = useId();

  const state: MenuRadioGroupState = { disabled };

  const contextValue: MenuRadioGroupContext<Value> = React.useMemo(
    () => ({ value, disabled, setValue }),
    [value, disabled, setValue],
  );

  const groupContextValue: MenuGroupContext = React.useMemo(() => ({ labelId }), [labelId]);

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityRole: 'radiogroup' as const,
        accessibilityLabelledBy: labelId,
        'aria-labelledby': labelId,
      },
      elementProps,
    ],
  });

  return (
    <MenuGroupContext.Provider value={groupContextValue}>
      <MenuRadioGroupContext.Provider value={contextValue}>
        {element}
      </MenuRadioGroupContext.Provider>
    </MenuGroupContext.Provider>
  );
}

export interface MenuRadioGroupState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface MenuRadioGroupProps<Value = any>
  extends Omit<ZestUIComponentProps<typeof View, MenuRadioGroupState>, 'value'> {
  /**
   * The value of the radio item that should be currently selected.
   *
   * To render an uncontrolled radio group, use the `defaultValue` prop instead.
   */
  value?: Value | undefined;
  /**
   * The value of the radio item that should be initially selected.
   *
   * To render a controlled radio group, use the `value` prop instead.
   */
  defaultValue?: Value | undefined;
  /**
   * Event handler called when the selected value changes.
   */
  onValueChange?:
    | ((value: Value, eventDetails: MenuRadioGroup.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export type MenuRadioGroupChangeEventReason = typeof REASONS.itemPress | typeof REASONS.none;

export type MenuRadioGroupChangeEventDetails =
  ZestChangeEventDetails<MenuRadioGroupChangeEventReason>;

export namespace MenuRadioGroup {
  export type State = MenuRadioGroupState;
  export type Props<Value = any> = MenuRadioGroupProps<Value>;
  export type ChangeEventReason = MenuRadioGroupChangeEventReason;
  export type ChangeEventDetails = MenuRadioGroupChangeEventDetails;
}
