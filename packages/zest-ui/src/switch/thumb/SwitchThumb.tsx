'use client';
import { View } from 'react-native';
import { useSwitchRootContext } from '../root/SwitchRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useTransitionStatus, type TransitionStatus } from '../../internals/useTransitionStatus';
import type { SwitchRootState } from '../root/SwitchRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * The movable part of the switch that indicates whether the switch is on or off.
 * Renders a `<View>`, or nothing when the switch is unchecked.
 *
 * Follows the animation contract: with `keepMounted`, the thumb stays mounted
 * while unchecked and publishes `transitionStatus` so the consumer can animate
 * it out. Without it, the thumb unmounts the moment it unchecks — React Native
 * cannot report when an exit animation finished.
 */
export function SwitchThumb(componentProps: SwitchThumb.Props) {
  const { render, className, style, keepMounted = false, ref, ...elementProps } = componentProps;

  const rootState = useSwitchRootContext();

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(rootState.checked);

  // Nothing reports when an exit animation finished, so a thumb that isn't
  // kept mounted is unmounted the moment it unchecks.
  useIsoLayoutEffect(() => {
    if (!rootState.checked && mounted && !keepMounted) {
      setMounted(false);
    }
  }, [rootState.checked, mounted, keepMounted, setMounted]);

  const state: SwitchThumbState = { ...rootState, transitionStatus };

  const shouldRender = keepMounted || mounted;

  return useRenderElement(View, componentProps, {
    state,
    ref,
    enabled: shouldRender,
    props: elementProps,
  });
}

export interface SwitchThumbState extends SwitchRootState {
  /**
   * The transition status of the thumb, for driving enter/exit animations.
   */
  transitionStatus: TransitionStatus;
}

export interface SwitchThumbProps
  extends ZestUIComponentProps<typeof View, SwitchThumbState> {
  /**
   * Whether to keep the element mounted when the switch is unchecked.
   *
   * Required to animate the thumb out; without it, it unmounts on uncheck.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace SwitchThumb {
  export type State = SwitchThumbState;
  export type Props = SwitchThumbProps;
}
