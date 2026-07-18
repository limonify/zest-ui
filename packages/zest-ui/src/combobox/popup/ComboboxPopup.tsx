'use client';
import { View } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { ZestUIComponentProps } from '../../types';

/**
 * A container for the filtered list.
 * Renders a `<View>`.
 */
export function ComboboxPopup(componentProps: ComboboxPopup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const { open } = useComboboxRootContext();

  const state: ComboboxPopupState = { open };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityRole: 'list' as const,
        // Claim the responder so presses inside never reach the backdrop.
        onStartShouldSetResponder: () => true,
      },
      elementProps,
    ],
  });

  return <CompositeList>{element}</CompositeList>;
}

export interface ComboboxPopupState {
  open: boolean;
}

export interface ComboboxPopupProps extends ZestUIComponentProps<typeof View, ComboboxPopupState> {}

export namespace ComboboxPopup {
  export type State = ComboboxPopupState;
  export type Props = ComboboxPopupProps;
}
