'use client';
import { View } from 'react-native';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';

/**
 * A decorative icon inside the trigger, hidden from assistive technology.
 * Renders a `<View>`.
 */
export function SelectIcon(componentProps: SelectIcon.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useSelectRootContext();
  const open = store.useState('open');

  const state: SelectIconState = { open };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants' as const,
        'aria-hidden': true,
      },
      elementProps,
    ],
  });
}

export interface SelectIconState {
  open: boolean;
}

export interface SelectIconProps extends ZestUIComponentProps<typeof View, SelectIconState> {}

export namespace SelectIcon {
  export type State = SelectIconState;
  export type Props = SelectIconProps;
}
