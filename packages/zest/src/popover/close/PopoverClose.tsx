'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A button that closes the popover.
 * Renders a `<Pressable>`.
 */
export function PopoverClose(componentProps: PopoverClose.Props) {
  const { render, className, style, disabled = false, ref, ...elementProps } = componentProps;

  const store = usePopoverRootContext();

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const state: PopoverCloseState = { disabled, pressed };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        onPress(event: GestureResponderEvent) {
          store.setOpen(false, createChangeEventDetails(REASONS.closePress, event));
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

export interface PopoverCloseState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the close button is currently pressed.
   */
  pressed: boolean;
}

export interface PopoverCloseProps
  extends BaseUIComponentProps<typeof Pressable, PopoverCloseState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace PopoverClose {
  export type State = PopoverCloseState;
  export type Props = PopoverCloseProps;
}
