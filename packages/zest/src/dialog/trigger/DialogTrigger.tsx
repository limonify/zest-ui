'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A button that opens the dialog.
 * Renders a `<Pressable>`.
 */
export function DialogTrigger(componentProps: DialogTrigger.Props) {
  const {
    render,
    className,
    style,
    disabled = false,
    ref,
    ...elementProps
  } = componentProps;

  const store = useDialogRootContext();
  const open = store.useState('open');

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const state: DialogTriggerState = { disabled, open, pressed };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onPress(event: GestureResponderEvent) {
          store.setOpen(true, createChangeEventDetails(REASONS.triggerPress, event));
        },
        onPressIn() {
          setPressed(true);
        },
        onPressOut() {
          setPressed(false);
        },
        accessibilityState: { expanded: open, disabled: disabled || undefined },
        'aria-haspopup': 'dialog' as const,
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface DialogTriggerState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
  /**
   * Whether the trigger is currently pressed.
   */
  pressed: boolean;
}

export interface DialogTriggerProps
  extends BaseUIComponentProps<typeof Pressable, DialogTriggerState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace DialogTrigger {
  export type State = DialogTriggerState;
  export type Props = DialogTriggerProps;
}
