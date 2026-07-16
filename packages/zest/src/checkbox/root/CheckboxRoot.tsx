'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useControlled } from '../../hooks/useControlled';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import type { ZestUIComponentProps } from '../../types';
import {
  createChangeEventDetails,
  type ZestChangeEventDetails,
} from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import { CheckboxRootContext } from './CheckboxRootContext';

/**
 * Represents the checkbox itself.
 * Renders a `<Pressable>`.
 *
 * TODO(field): Field/Form integration once those components are ported.
 */
export function CheckboxRoot(componentProps: CheckboxRoot.Props) {
  const {
    checked: checkedProp,
    className,
    defaultChecked = false,
    disabled: disabledProp = false,
    indeterminate = false,
    onCheckedChange,
    parent = false,
    readOnly = false,
    render,
    required = false,
    style,
    value,
    ref,
    ...elementProps
  } = componentProps;

  const groupContext = useCheckboxGroupContext();
  const parentContext = groupContext?.parent;
  const isGroupedWithParent = parentContext != null && groupContext?.allValues != null;

  const disabled = (groupContext?.disabled || disabledProp) ?? false;

  const { getButtonProps } = useButton({ disabled });

  let groupProps: Partial<Pick<CheckboxRoot.Props, 'checked' | 'indeterminate' | 'onCheckedChange'>> =
    {};
  if (isGroupedWithParent) {
    if (parent) {
      groupProps = parentContext.getParentProps();
    } else if (value) {
      groupProps = parentContext.getChildProps(value);
    }
  }

  const {
    checked: groupChecked = checkedProp,
    indeterminate: groupIndeterminate = indeterminate,
    onCheckedChange: groupOnChange,
  } = groupProps;

  const groupValue = groupContext?.value;
  const setGroupValue = groupContext?.setValue;
  const defaultGroupValue = groupContext?.defaultValue;

  const [checked, setCheckedState] = useControlled({
    controlled: value && groupValue && !parent ? groupValue.includes(value) : groupChecked,
    default:
      value && defaultGroupValue && !parent ? defaultGroupValue.includes(value) : defaultChecked,
    name: 'Checkbox',
    state: 'checked',
  });

  const computedChecked = isGroupedWithParent ? Boolean(groupChecked) : checked;
  const computedIndeterminate = isGroupedWithParent
    ? groupIndeterminate || indeterminate
    : indeterminate;

  React.useEffect(() => {
    if (!parentContext || !value) {
      return undefined;
    }

    const disabledStates = parentContext.disabledStatesRef.current;
    disabledStates.set(value, disabled);

    return () => {
      disabledStates.delete(value);
    };
  }, [parentContext, disabled, value]);

  const state: CheckboxRootState = React.useMemo(
    () => ({
      checked: computedChecked,
      disabled,
      readOnly,
      required,
      indeterminate: computedIndeterminate,
    }),
    [computedChecked, disabled, readOnly, required, computedIndeterminate],
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

          const nextChecked = !computedChecked;
          const eventDetails = createChangeEventDetails(REASONS.none, event);

          onCheckedChange?.(nextChecked, eventDetails);

          if (eventDetails.isCanceled) {
            return;
          }

          groupOnChange?.(nextChecked, eventDetails);

          if (eventDetails.isCanceled) {
            return;
          }

          setCheckedState(nextChecked);

          if (value && groupValue && setGroupValue && !parent && !isGroupedWithParent) {
            const nextGroupValue = nextChecked
              ? [...groupValue, value]
              : groupValue.filter((item) => item !== value);

            setGroupValue(nextGroupValue, eventDetails);
          }
        },
        accessibilityRole: 'checkbox' as const,
        accessibilityState: {
          checked: computedIndeterminate ? ('mixed' as const) : computedChecked,
          disabled: disabled || undefined,
        },
      },
      elementProps,
      getButtonProps,
    ],
  });

  return (
    <CheckboxRootContext.Provider value={state}>{element}</CheckboxRootContext.Provider>
  );
}

export interface CheckboxRootState {
  /**
   * Whether the checkbox is currently ticked.
   */
  checked: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the user should be unable to tick or untick the checkbox.
   */
  readOnly: boolean;
  /**
   * Whether the user must tick the checkbox before submitting a form.
   */
  required: boolean;
  /**
   * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
   */
  indeterminate: boolean;
}

export interface CheckboxRootProps
  extends Omit<ZestUIComponentProps<typeof Pressable, CheckboxRootState>, 'onPress' | 'value'> {
  /**
   * Whether the checkbox is currently ticked.
   *
   * To render an uncontrolled checkbox, use the `defaultChecked` prop instead.
   */
  checked?: boolean | undefined;
  /**
   * The value identifying the checkbox within a `<CheckboxGroup>`.
   */
  value?: string | undefined;
  /**
   * Whether the checkbox controls a parent checkbox in a `<CheckboxGroup>`.
   * A parent checkbox ticks or unticks all of the group's checkboxes at once,
   * and reports a mixed state while only some of them are ticked.
   * @default false
   */
  parent?: boolean | undefined;
  /**
   * Whether the checkbox is initially ticked.
   *
   * To render a controlled checkbox, use the `checked` prop instead.
   * @default false
   */
  defaultChecked?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the checkbox is in a mixed state: neither ticked, nor unticked.
   * @default false
   */
  indeterminate?: boolean | undefined;
  /**
   * Event handler called when the checkbox is ticked or unticked.
   */
  onCheckedChange?:
    | ((checked: boolean, eventDetails: CheckboxRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the user should be unable to tick or untick the checkbox.
   * @default false
   */
  readOnly?: boolean | undefined;
  /**
   * Whether the user must tick the checkbox before submitting a form.
   * @default false
   */
  required?: boolean | undefined;
}

export type CheckboxRootChangeEventReason = typeof REASONS.none;

export namespace CheckboxRoot {
  export type State = CheckboxRootState;
  export type Props = CheckboxRootProps;
  export type ChangeEventReason = CheckboxRootChangeEventReason;
  export type ChangeEventDetails = ZestChangeEventDetails<CheckboxRootChangeEventReason>;
}
