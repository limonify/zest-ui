'use client';
import { Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A backdrop for the select popup, and the surface that dismisses it.
 * Renders a `<Pressable>`.
 */
export function SelectBackdrop(componentProps: SelectBackdrop.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useSelectRootContext();
  const open = store.useState('open');

  const state: SelectBackdropState = { open };

  return useRenderElement(Pressable, componentProps, {
    state,
    ref,
    props: [
      {
        style: StyleSheet.absoluteFill,
        onPress(event: GestureResponderEvent) {
          store.setOpen(false, createChangeEventDetails(REASONS.outsidePress, event));
        },
      },
      elementProps,
    ],
  });
}

export interface SelectBackdropState {
  open: boolean;
}

export interface SelectBackdropProps
  extends BaseUIComponentProps<typeof Pressable, SelectBackdropState> {}

export namespace SelectBackdrop {
  export type State = SelectBackdropState;
  export type Props = SelectBackdropProps;
}
