'use client';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { useDialogPopupProps } from './useDialogPopupProps';

/**
 * A container for the dialog contents.
 * Renders a `<View>`.
 */
export function DialogPopup(componentProps: DialogPopup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { open, transitionStatus, props } = useDialogPopupProps();

  const state: DialogPopupState = { open, transitionStatus };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [props, elementProps],
  });
}

export interface DialogPopupState {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;
  /**
   * The transition status of the dialog: `'starting'` as it opens (auto-clears
   * to `undefined` after one frame), `'ending'` once it is closing.
   */
  transitionStatus: TransitionStatus;
}

export interface DialogPopupProps extends ZestUIComponentProps<typeof View, DialogPopupState> {}

export namespace DialogPopup {
  export type State = DialogPopupState;
  export type Props = DialogPopupProps;
}
