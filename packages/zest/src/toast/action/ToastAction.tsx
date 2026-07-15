'use client';
import * as React from 'react';
import { Pressable } from 'react-native';
import { useToastRootContext } from '../root/ToastRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import type { ToastRootState } from '../root/ToastRoot';
import type { BaseUIComponentProps } from '../../types';

/**
 * Performs an action when pressed.
 * Renders a `<Pressable>`.
 *
 * **Diverges from the web deliberately.** Upstream reads the button's props off
 * the toast object (`actionProps`), so a toast pushed from outside React can
 * carry its own handler. That type is `React.ComponentPropsWithoutRef<'button'>`
 * — DOM props — so zest drops it: wire this part up with `onPress` where you
 * render it, or put what you need on the toast's `data` and read it from there.
 */
export function ToastAction(componentProps: ToastAction.Props) {
  const { render, className, style, disabled = false, ref, ...elementProps } = componentProps;

  const { state } = useToastRootContext();

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const actionState: ToastActionState = { ...state, disabled, pressed };

  return useRenderElement(Pressable, componentProps, {
    state: actionState,
    ref,
    props: [
      {
        onPressIn() {
          setPressed(true);
        },
        onPressOut() {
          setPressed(false);
        },
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface ToastActionState extends ToastRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the button is currently pressed.
   */
  pressed: boolean;
}

export interface ToastActionProps extends BaseUIComponentProps<typeof Pressable, ToastActionState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace ToastAction {
  export type State = ToastActionState;
  export type Props = ToastActionProps;
}
