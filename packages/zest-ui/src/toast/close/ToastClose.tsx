'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useToastProviderContext } from '../provider/ToastProviderContext';
import { useToastRootContext } from '../root/ToastRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import type { ToastRootState } from '../root/ToastRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * Closes the toast.
 * Renders a `<Pressable>`.
 */
export function ToastClose(componentProps: ToastClose.Props) {
  const { render, className, style, disabled = false, ref, ...elementProps } = componentProps;

  const store = useToastProviderContext();
  const { toast, state } = useToastRootContext();

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const closeState: ToastCloseState = { ...state, disabled, pressed };

  return useRenderElement(Pressable, componentProps, {
    state: closeState,
    ref,
    props: [
      {
        onPress(_event: GestureResponderEvent) {
          store.closeToast(toast.id);
        },
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

export interface ToastCloseState extends ToastRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the button is currently pressed.
   */
  pressed: boolean;
}

export interface ToastCloseProps extends ZestUIComponentProps<typeof Pressable, ToastCloseState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace ToastClose {
  export type State = ToastCloseState;
  export type Props = ToastCloseProps;
}
