'use client';
import { Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useDialogPortalContext } from '../portal/DialogPortalContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';

/**
 * A positioning container for the dialog popup.
 * Renders a full-screen `<Pressable>` that dismisses the dialog on outside
 * press (unless `disablePointerDismissal` is set on the root). Presses inside
 * `<Dialog.Popup>` are claimed by the popup and never reach the viewport.
 */
export function DialogViewport(componentProps: DialogViewport.Props) {
  const { render, className, style, children, ref, ...elementProps } = componentProps;

  const keepMounted = useDialogPortalContext();
  const store = useDialogRootContext();

  const open = store.useState('open');

  const state: DialogViewportState = { open };

  const shouldRender = keepMounted || open;

  return useRenderElement(Pressable, componentProps, {
    enabled: shouldRender,
    state,
    ref,
    props: [
      {
        style: StyleSheet.absoluteFill,
        accessible: false,
        onPress(event: GestureResponderEvent) {
          if (store.state.disablePointerDismissal) {
            return;
          }
          store.setOpen(false, createChangeEventDetails(REASONS.outsidePress, event));
        },
        children,
      },
      elementProps,
    ],
  });
}

export interface DialogViewportState {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
}

export interface DialogViewportProps
  extends ZestUIComponentProps<typeof Pressable, DialogViewportState> {}

export namespace DialogViewport {
  export type State = DialogViewportState;
  export type Props = DialogViewportProps;
}
