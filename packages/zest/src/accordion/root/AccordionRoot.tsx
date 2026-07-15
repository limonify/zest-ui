'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useControlled } from '../../hooks/useControlled';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { BaseUIComponentProps } from '../../types';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { AccordionRootContext } from './AccordionRootContext';

/**
 * Groups all parts of the accordion.
 * Renders a `<View>`.
 *
 * Upstream's `orientation` and `loopFocus` props are omitted: both are
 * deprecated there (roving focus was removed) and neither has meaning without
 * a keyboard.
 */
export function AccordionRoot<Value = any>(componentProps: AccordionRoot.Props<Value>) {
  const {
    className,
    defaultValue: defaultValueProp,
    disabled = false,
    keepMounted = false,
    multiple = false,
    onValueChange,
    render,
    style,
    value: valueProp,
    ref,
    ...elementProps
  } = componentProps;

  // Memoized to allow omitting both defaultValue and value, which would
  // otherwise trigger a warning in useControlled.
  const defaultValue = React.useMemo(() => {
    if (valueProp === undefined) {
      return defaultValueProp ?? [];
    }

    return undefined;
  }, [valueProp, defaultValueProp]);

  const [value, setValue] = useControlled<AccordionValue<Value>>({
    controlled: valueProp,
    default: defaultValue,
    name: 'Accordion',
    state: 'value',
  });

  const handleValueChange = useStableCallback(
    (newValue: Value, nextOpen: boolean, eventDetails: AccordionRoot.ChangeEventDetails) => {
      if (!multiple) {
        const nextValue = value[0] === newValue ? [] : [newValue];
        onValueChange?.(nextValue, eventDetails);
        if (eventDetails.isCanceled) {
          return;
        }
        setValue(nextValue);
      } else if (nextOpen) {
        const nextOpenValues = value.slice();
        nextOpenValues.push(newValue);
        onValueChange?.(nextOpenValues, eventDetails);
        if (eventDetails.isCanceled) {
          return;
        }
        setValue(nextOpenValues);
      } else {
        const nextOpenValues = value.filter((v) => v !== newValue);
        onValueChange?.(nextOpenValues, eventDetails);
        if (eventDetails.isCanceled) {
          return;
        }
        setValue(nextOpenValues);
      }
    },
  );

  const state: AccordionRootState<Value> = React.useMemo(
    () => ({ value, disabled }),
    [value, disabled],
  );

  const contextValue: AccordionRootContext<Value> = React.useMemo(
    () => ({ disabled, handleValueChange, keepMounted, state, value }),
    [disabled, handleValueChange, keepMounted, state, value],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });

  return (
    <AccordionRootContext.Provider value={contextValue}>{element}</AccordionRootContext.Provider>
  );
}

export type AccordionValue<Value = any> = Value[];

export interface AccordionRootState<Value = any> {
  /**
   * The current value.
   */
  value: AccordionValue<Value>;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface AccordionRootProps<Value = any>
  extends Omit<BaseUIComponentProps<typeof View, AccordionRootState<Value>>, 'value'> {
  /**
   * The controlled value of the item(s) that should be expanded.
   *
   * To render an uncontrolled accordion, use the `defaultValue` prop instead.
   */
  value?: AccordionValue<Value> | undefined;
  /**
   * The uncontrolled value of the item(s) that should be initially expanded.
   *
   * To render a controlled accordion, use the `value` prop instead.
   */
  defaultValue?: AccordionValue<Value> | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether to keep the element rendered while the panel is closed.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * Event handler called when an accordion item is expanded or collapsed.
   * Provides the new value as an argument.
   */
  onValueChange?:
    | ((value: AccordionValue<Value>, eventDetails: AccordionRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether multiple items can be open at the same time.
   * @default false
   */
  multiple?: boolean | undefined;
}

export type AccordionRootChangeEventReason = typeof REASONS.triggerPress | typeof REASONS.none;

export type AccordionRootChangeEventDetails =
  ZestChangeEventDetails<AccordionRootChangeEventReason>;

export namespace AccordionRoot {
  export type Value<TValue = any> = AccordionValue<TValue>;
  export type State<TValue = any> = AccordionRootState<TValue>;
  export type Props<TValue = any> = AccordionRootProps<TValue>;
  export type ChangeEventReason = AccordionRootChangeEventReason;
  export type ChangeEventDetails = AccordionRootChangeEventDetails;
}
