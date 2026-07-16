'use client';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useControlled } from '../hooks/useControlled';
import { useId } from '../hooks/useId';
import { useIsoLayoutEffect } from '../hooks/useIsoLayoutEffect';
import { useRenderElement } from '../use-render/useRenderElement';
import { useButton } from '../internals/use-button/useButton';
import { useToggleGroupContext } from '../toggle-group/ToggleGroupContext';
import type { BaseUIComponentProps } from '../types';
import { error } from '../utils/error';
import {
  createChangeEventDetails,
  type ZestChangeEventDetails,
} from '../utils/createChangeEventDetails';
import { REASONS } from '../utils/reasons';

/**
 * A two-state button that can be on or off.
 * Renders a `<Pressable>`.
 */
export function Toggle<Value extends string = string>(componentProps: Toggle.Props<Value>) {
  const {
    className,
    defaultPressed: defaultPressedProp = false,
    disabled: disabledProp = false,
    onPressedChange,
    pressed: pressedProp,
    render,
    style,
    value: valueProp,
    ref,
    ...elementProps
  } = componentProps;

  // `|| undefined` handles cases where value is falsy (i.e. "")
  // The group is consumed as `string`-valued: a Toggle's `value` is always a string at
  // runtime (falling back to a generated id), and `Value extends string`.
  const value = useId(valueProp || undefined);
  const groupContext = useToggleGroupContext();
  const groupValue = groupContext?.value ?? [];

  const defaultPressed = groupContext ? undefined : defaultPressedProp;

  const disabled = (disabledProp || groupContext?.disabled) ?? false;

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
      if (groupContext && valueProp === undefined && groupContext.isValueInitialized) {
        error(
          'A `<Toggle>` component rendered in a `<ToggleGroup>` has no explicit `value` prop.',
          'This will cause issues between the Toggle Group and Toggle values.',
          'Provide the `<Toggle>` with a `value` prop matching the `<ToggleGroup>` values prop type.',
        );
      }
    }, [groupContext, valueProp, groupContext?.isValueInitialized]);
  }

  const [pressed, setPressedState] = useControlled({
    controlled: groupContext ? value !== undefined && groupValue.indexOf(value) > -1 : pressedProp,
    default: defaultPressed,
    name: 'Toggle',
    state: 'pressed',
  });

  const { getButtonProps } = useButton({ disabled });

  const state: ToggleState = { disabled, pressed };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityRole: 'button' as const,
        accessibilityState: { selected: pressed, disabled: disabled || undefined },
        'aria-pressed': pressed,
        onPress(event: GestureResponderEvent) {
          if (disabled) {
            return;
          }

          const nextPressed = !pressed;
          const eventDetails = createChangeEventDetails(REASONS.none, event);

          // `onPressedChange` runs before the group commits so that canceling here
          // can also veto the group value change, which shares this `eventDetails` object.
          onPressedChange?.(nextPressed, eventDetails);

          if (eventDetails.isCanceled) {
            return;
          }

          if (value) {
            groupContext?.setGroupValue?.(value, nextPressed, eventDetails);
          }

          if (eventDetails.isCanceled) {
            return;
          }

          setPressedState(nextPressed);
        },
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface ToggleState {
  /**
   * Whether the toggle is currently pressed.
   */
  pressed: boolean;
  /**
   * Whether the toggle should ignore user interaction.
   */
  disabled: boolean;
}

export interface ToggleProps<Value extends string = string>
  extends Omit<BaseUIComponentProps<typeof Pressable, ToggleState>, 'onPress'> {
  /**
   * Whether the toggle button is currently pressed.
   * This is the controlled counterpart of `defaultPressed`.
   */
  pressed?: boolean | undefined;
  /**
   * Whether the toggle button is currently pressed.
   * This is the uncontrolled counterpart of `pressed`.
   * @default false
   */
  defaultPressed?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Callback fired when the pressed state is changed.
   */
  onPressedChange?:
    | ((pressed: boolean, eventDetails: Toggle.ChangeEventDetails) => void)
    | undefined;
  /**
   * A unique string that identifies the toggle when used
   * inside a toggle group.
   */
  value?: Value | undefined;
}

export type ToggleChangeEventReason = typeof REASONS.none;

export type ToggleChangeEventDetails = ZestChangeEventDetails<ToggleChangeEventReason>;

export namespace Toggle {
  export type State = ToggleState;
  export type Props<Value extends string = string> = ToggleProps<Value>;
  export type ChangeEventReason = ToggleChangeEventReason;
  export type ChangeEventDetails = ToggleChangeEventDetails;
}
