'use client';
import { Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { BaseUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A backdrop for the popover, and the surface that dismisses it.
 * Renders a `<Pressable>`.
 *
 * Unlike `Dialog`, the popover has no separate viewport part: the backdrop is
 * both the (optional) dimming layer and the outside-press surface, matching
 * upstream, where `Popover.Backdrop` is what closes the popup.
 */
export function PopoverBackdrop(componentProps: PopoverBackdrop.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = usePopoverRootContext();
  const open = store.useState('open');
  const disablePointerDismissal = store.useState('disablePointerDismissal');

  const state: PopoverBackdropState = { open };

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

export interface PopoverBackdropState {
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
}

export interface PopoverBackdropProps
  extends BaseUIComponentProps<typeof Pressable, PopoverBackdropState> {}

export namespace PopoverBackdrop {
  export type State = PopoverBackdropState;
  export type Props = PopoverBackdropProps;
}
