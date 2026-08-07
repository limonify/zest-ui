'use client';
import { View } from 'react-native';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { useComboboxTransitionContext } from '../root/ComboboxTransitionContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { Align, PhysicalSide } from '../../utils/useAnchorPositioning';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

/**
 * A container for the filtered list.
 * Renders a `<View>`.
 */
export function ComboboxPopup(componentProps: ComboboxPopup.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const { side, align } = useComboboxPositionerContext();
  const { transitionStatus } = useComboboxTransitionContext() ?? { transitionStatus: undefined };

  const open = useStoreState(store, 'open');
  const multiple = useStoreState(store, 'multiple');
  const triggerWidth = useStoreState(store, 'triggerWidth');
  const triggerHeight = useStoreState(store, 'triggerHeight');

  const state: ComboboxPopupState = {
    open,
    transitionStatus,
    side,
    align,
    triggerWidth,
    triggerHeight,
  };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        accessibilityRole: 'list' as const,
        'aria-multiselectable': multiple || undefined,
        // Claim the responder so presses inside never reach the backdrop.
        onStartShouldSetResponder: () => true,
      },
      elementProps,
    ],
  });

  // Items register here so they can be indexed in visual order.
  return <CompositeList>{element}</CompositeList>;
}

export interface ComboboxPopupState {
  /**
   * Whether the list is currently open.
   */
  open: boolean;
  /**
   * The transition status of the list: `'starting'` as it opens (auto-clears to
   * `undefined` after one frame), `'ending'` once it is closing.
   */
  transitionStatus: TransitionStatus;
  /**
   * The side the popup was actually placed on, after collision handling.
   */
  side: PhysicalSide;
  /**
   * The alignment the popup was actually placed with.
   */
  align: Align;
  /**
   * The input's measured width, available for consumers to apply to the popup.
   */
  triggerWidth: number | undefined;
  /**
   * The input's measured height.
   */
  triggerHeight: number | undefined;
}

export interface ComboboxPopupProps extends ZestUIComponentProps<typeof View, ComboboxPopupState> {}

export namespace ComboboxPopup {
  export type State = ComboboxPopupState;
  export type Props = ComboboxPopupProps;
}
