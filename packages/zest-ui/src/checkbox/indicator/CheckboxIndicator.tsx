'use client';
import { View } from 'react-native';
import { useCheckboxRootContext } from '../root/CheckboxRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useTransitionStatus, type TransitionStatus } from '../../internals/useTransitionStatus';
import type { CheckboxRootState } from '../root/CheckboxRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * Indicates whether the checkbox is ticked.
 * Renders a `<View>`, or nothing when the checkbox is unchecked.
 *
 * Follows the animation contract: with `keepMounted`, the indicator stays
 * mounted while unchecked and publishes `transitionStatus` so the consumer can
 * animate it out. Without it, the indicator unmounts the moment it unchecks —
 * React Native cannot report when an exit animation finished.
 */
export function CheckboxIndicator(componentProps: CheckboxIndicator.Props) {
  const { render, className, style, keepMounted = false, ref, ...elementProps } = componentProps;

  const rootState = useCheckboxRootContext();

  const rendered = rootState.checked || rootState.indeterminate;

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(rendered);

  // Nothing reports when an exit animation finished, so an indicator that isn't
  // kept mounted is unmounted the moment it unchecks.
  useIsoLayoutEffect(() => {
    if (!rendered && mounted && !keepMounted) {
      setMounted(false);
    }
  }, [rendered, mounted, keepMounted, setMounted]);

  const state: CheckboxIndicatorState = { ...rootState, transitionStatus };

  const shouldRender = keepMounted || mounted;

  return useRenderElement(View, componentProps, {
    ref,
    state,
    enabled: shouldRender,
    props: elementProps,
  });
}

export interface CheckboxIndicatorState extends CheckboxRootState {
  /**
   * The transition status of the indicator, for driving enter/exit animations.
   */
  transitionStatus: TransitionStatus;
}

export interface CheckboxIndicatorProps
  extends ZestUIComponentProps<typeof View, CheckboxIndicatorState> {
  /**
   * Whether to keep the element mounted when the checkbox is not checked.
   *
   * Required to animate the indicator out; without it, it unmounts on uncheck.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace CheckboxIndicator {
  export type State = CheckboxIndicatorState;
  export type Props = CheckboxIndicatorProps;
}
