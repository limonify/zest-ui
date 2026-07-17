'use client';
import { StyleSheet, View } from 'react-native';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';

/**
 * A visual overlay behind the popup.
 * Renders a `<View>` filling the screen.
 *
 * Purely presentational: it never intercepts touches. Outside-press dismissal
 * is handled by `<Dialog.Viewport>`.
 */
export function DialogBackdrop(componentProps: DialogBackdrop.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useDialogRootContext();
  const open = store.useState('open');

  const state: DialogBackdropState = { open };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        style: StyleSheet.absoluteFill,
        pointerEvents: 'none' as const,
        accessible: false,
        importantForAccessibility: 'no-hide-descendants' as const,
      },
      elementProps,
    ],
  });
}

export interface DialogBackdropState {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
}

export interface DialogBackdropProps
  extends ZestUIComponentProps<typeof View, DialogBackdropState> {}

export namespace DialogBackdrop {
  export type State = DialogBackdropState;
  export type Props = DialogBackdropProps;
}
