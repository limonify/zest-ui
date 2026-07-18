'use client';
import * as React from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useButton } from '../../internals/use-button/useButton';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A button that closes the dialog.
 * Renders a `<Pressable>`.
 */
export function DialogClose(componentProps: DialogClose.Props) {
  const {
    render,
    className,
    style,
    disabled = false,
    ref,
    ...elementProps
  } = componentProps;

  const store = useDialogRootContext();

  const [pressed, setPressed] = React.useState(false);

  const { getButtonProps } = useButton({ disabled });

  const state: DialogCloseState = { disabled, pressed };

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

export interface DialogCloseState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the close button is currently pressed.
   */
  pressed: boolean;
}

export interface DialogCloseProps
  extends ZestUIComponentProps<typeof Pressable, DialogCloseState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace DialogClose {
  export type State = DialogCloseState;
  export type Props = DialogCloseProps;
}
