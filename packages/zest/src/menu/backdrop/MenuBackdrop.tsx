'use client';
import { Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A backdrop for the menu, and the surface that dismisses it.
 * Renders a `<Pressable>`.
 */
export function MenuBackdrop(componentProps: MenuBackdrop.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useMenuRootContext();
  const open = store.useState('open');
  const disablePointerDismissal = store.useState('disablePointerDismissal');

  const state: MenuBackdropState = { open };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        style: StyleSheet.absoluteFill,
        onPress(event: GestureResponderEvent) {
          if (disablePointerDismissal) {
            return;
          }

          store.setOpen(false, createChangeEventDetails(REASONS.outsidePress, event));
        },
      },
      elementProps,
    ],
  });
}

export interface MenuBackdropState {
  open: boolean;
}

export interface MenuBackdropProps
  extends BaseUIComponentProps<typeof Pressable, MenuBackdropState> {}

export namespace MenuBackdrop {
  export type State = MenuBackdropState;
  export type Props = MenuBackdropProps;
}
