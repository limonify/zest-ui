'use client';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { BaseUIComponentProps } from '../../types';
import { useDialogPopupProps } from './useDialogPopupProps';

/**
 * A container for the dialog contents.
 * Renders a `<View>`.
 */
export function DialogPopup(componentProps: DialogPopup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { open, props } = useDialogPopupProps();

  const state: DialogPopupState = { open };

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
}

export interface DialogPopupProps extends BaseUIComponentProps<typeof View, DialogPopupState> {}

export namespace DialogPopup {
  export type State = DialogPopupState;
  export type Props = DialogPopupProps;
}
