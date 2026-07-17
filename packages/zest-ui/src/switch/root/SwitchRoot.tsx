'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useControlled } from '../../hooks/useControlled';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import { useFieldControlRegistration } from '../../internals/field/useFieldControlRegistration';
import type { ZestUIComponentProps } from '../../types';
import {
  createChangeEventDetails,
  type ZestChangeEventDetails,
} from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { SwitchRootContext } from './SwitchRootContext';

/**
 * Represents the switch itself.
 * Renders a `<Pressable>`.
 *
 * Unlike the web version there is no hidden `<input>`: React Native has no
 * native form submission, so `name`/`value`/`form` props are omitted.
 */
export function SwitchRoot(componentProps: SwitchRoot.Props) {
  const {
    checked: checkedProp,
    className,
    defaultChecked = false,
    disabled: disabledProp = false,
    onCheckedChange,
    readOnly = false,
    render,
    required = false,
    style,
    ref,
    ...elementProps
  } = componentProps;

  const { fieldDisabled, fieldProps, validateField } = useFieldControlRegistration();

  const disabled = disabledProp || fieldDisabled;

  const { getButtonProps } = useButton({ disabled });

  const [checked, setCheckedState] = useControlled({
    controlled: checkedProp,
    default: defaultChecked,
    name: 'Switch',
    state: 'checked',
  });

  const state: SwitchRootState = React.useMemo(
    () => ({
      checked,
      disabled,
      readOnly,
      required,
    }),
    [checked, disabled, readOnly, required],
  );

  const element = useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onPress(event: GestureResponderEvent) {
          if (readOnly || disabled) {
            return;
          }

          const nextChecked = !checked;
          const eventDetails = createChangeEventDetails(REASONS.none, event);

          onCheckedChange?.(nextChecked, eventDetails);

          if (eventDetails.isCanceled) {
            return;
          }

          setCheckedState(nextChecked);
          validateField(nextChecked);
        },
        accessibilityRole: 'switch' as const,
        accessibilityState: {
          checked,
          disabled: disabled || undefined,
        },
        'aria-readonly': readOnly || undefined,
        'aria-required': required || undefined,
        ...fieldProps,
      },
      elementProps,
      getButtonProps,
    ],
  });

  return <SwitchRootContext.Provider value={state}>{element}</SwitchRootContext.Provider>;
}

export interface SwitchRootState {
  /**
   * Whether the switch is currently active.
   */
  checked: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the user should be unable to activate or deactivate the switch.
   */
  readOnly: boolean;
  /**
   * Whether the user must activate the switch before submitting a form.
   */
  required: boolean;
}

export interface SwitchRootProps
  extends Omit<ZestUIComponentProps<typeof Pressable, SwitchRootState>, 'onPress'> {
  /**
   * Whether the switch is currently active.
   *
   * To render an uncontrolled switch, use the `defaultChecked` prop instead.
   */
  checked?: boolean | undefined;
  /**
   * Whether the switch is initially active.
   *
   * To render a controlled switch, use the `checked` prop instead.
   * @default false
   */
  defaultChecked?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Event handler called when the switch is activated or deactivated.
   */
  onCheckedChange?:
    | ((checked: boolean, eventDetails: SwitchRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the user should be unable to activate or deactivate the switch.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Whether the user must activate the switch before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
}

export type SwitchRootChangeEventReason = typeof REASONS.none;

export namespace SwitchRoot {
  export type State = SwitchRootState;
  export type Props = SwitchRootProps;
  export type ChangeEventReason = SwitchRootChangeEventReason;
  export type ChangeEventDetails = ZestChangeEventDetails<SwitchRootChangeEventReason>;
}
