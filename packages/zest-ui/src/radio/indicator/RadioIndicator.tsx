'use client';
import { View } from 'react-native';
import { useRadioRootContext } from '../root/RadioRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useTransitionStatus, type TransitionStatus } from '../../internals/useTransitionStatus';
import type { RadioRootState } from '../root/RadioRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * Indicates whether the radio button is selected.
 * Renders a `<View>`, or nothing when the radio is inactive.
 *
 * Follows the animation contract: with `keepMounted`, the indicator stays
 * mounted while inactive and publishes `transitionStatus` so the consumer can
 * animate it out. Without it, the indicator unmounts the moment it deselects —
 * React Native cannot report when an exit animation finished.
 */
export function RadioIndicator(componentProps: RadioIndicator.Props) {
  const { render, className, style, keepMounted = false, ref, ...elementProps } = componentProps;

  const rootState = useRadioRootContext();

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(rootState.checked);

  // Nothing reports when an exit animation finished, so an indicator that isn't
  // kept mounted is unmounted the moment it deselects.
  useIsoLayoutEffect(() => {
    if (!rootState.checked && mounted && !keepMounted) {
      setMounted(false);
    }
  }, [rootState.checked, mounted, keepMounted, setMounted]);

  const state: RadioIndicatorState = { ...rootState, transitionStatus };

  const shouldRender = keepMounted || mounted;

  return useRenderElement(View, componentProps, {
    state,
    ref,
    enabled: shouldRender,
    props: elementProps,
  });
}

export interface RadioIndicatorState extends RadioRootState {
  /**
   * The transition status of the indicator, for driving enter/exit animations.
   */
  transitionStatus: TransitionStatus;
}

export interface RadioIndicatorProps
  extends ZestUIComponentProps<typeof View, RadioIndicatorState> {
  /**
   * Whether to keep the element mounted when the radio button is inactive.
   *
   * Required to animate the indicator out; without it, it unmounts on deselect.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace RadioIndicator {
  export type State = RadioIndicatorState;
  export type Props = RadioIndicatorProps;
}
