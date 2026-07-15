'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useButton } from '../internals/use-button/useButton';
import { useRenderElement } from '../use-render/useRenderElement';
import type { BaseUIComponentProps } from '../types';

/**
 * A button component that can be used to trigger actions.
 * Renders a `<Pressable>`.
 */
export function Button(componentProps: Button.Props) {
  const { render, className, disabled = false, style, ref, ...elementProps } = componentProps;

  // The web version gets `:active` from CSS; React Native must track the
  // pressed state explicitly so `style`/`className`/`render` functions can
  // react to it.
  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const state: ButtonState = { disabled, pressed };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onPressIn(event: GestureResponderEvent) {
          setPressed(true);
        },
        onPressOut(event: GestureResponderEvent) {
          setPressed(false);
        },
      },
      elementProps,
      getButtonProps,
    ],
  });
}

export interface ButtonState {
  /**
   * Whether the button should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the button is currently pressed.
   */
  pressed: boolean;
}

export interface ButtonProps extends BaseUIComponentProps<typeof Pressable, ButtonState> {
  /**
   * Whether the button should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace Button {
  export type State = ButtonState;
  export type Props = ButtonProps;
}
