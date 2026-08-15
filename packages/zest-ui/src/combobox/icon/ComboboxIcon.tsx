'use client';
import { View } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * A decorative icon inside the trigger, hidden from assistive technology.
 * Renders a `<View>`.
 *
 * The same part as `Select.Icon`, for the combobox's trigger — the chevron a
 * consumer draws to show that the list can open.
 */
export function ComboboxIcon(componentProps: ComboboxIcon.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const open = useStoreState(store, 'open');

  const state: ComboboxIconState = { open };

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

export interface ComboboxIconState {
  open: boolean;
}

export interface ComboboxIconProps extends ZestUIComponentProps<typeof View, ComboboxIconState> {}

export namespace ComboboxIcon {
  export type State = ComboboxIconState;
  export type Props = ComboboxIconProps;
}
