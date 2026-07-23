'use client';
import { Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';

/**
 * A full-screen surface that dismisses the list on an outside press.
 * Renders a `<Pressable>`.
 */
export function ComboboxBackdrop(componentProps: ComboboxBackdrop.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { open, setOpen, inputRef } = useComboboxRootContext();

  const state: ComboboxBackdropState = { open };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        style: StyleSheet.absoluteFill,
        onPress(event: GestureResponderEvent) {
          setOpen(false, event);
          inputRef?.current?.blur();
        },
      },
      elementProps,
    ],
  });
}

export interface ComboboxBackdropState {
  open: boolean;
}

export interface ComboboxBackdropProps
  extends ZestUIComponentProps<typeof Pressable, ComboboxBackdropState> {}

export namespace ComboboxBackdrop {
  export type State = ComboboxBackdropState;
  export type Props = ComboboxBackdropProps;
}
