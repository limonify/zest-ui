'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';
import type { CollapsibleRootState } from '../root/CollapsibleRoot';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { BaseUIComponentProps } from '../../types';
import { useCollapsiblePanel } from './useCollapsiblePanel';

/**
 * A panel with the collapsible contents.
 * Renders a `<View>`.
 *
 * The panel measures its natural content size and publishes it on the state
 * object as `height`/`width` — the React Native counterpart of the web version's
 * `--collapsible-panel-height` CSS variable. Drive an `Animated` value from
 * `state.height` and `state.transitionStatus` to animate the panel.
 */
export function CollapsiblePanel(componentProps: CollapsiblePanel.Props) {
  const {
    className,
    keepMounted = false,
    render,
    style,
    ref,
    children,
    ...elementProps
  } = componentProps;

  const { state: rootState, transitionStatus } = useCollapsibleRootContext();

  const { dimensions, props, shouldRender, wrappedChildren } = useCollapsiblePanel({
    keepMounted,
    children,
  });

  const state: CollapsiblePanelState = React.useMemo(
    () => ({
      ...rootState,
      transitionStatus,
      height: dimensions.height,
      width: dimensions.width,
    }),
    [rootState, transitionStatus, dimensions.height, dimensions.width],
  );

  return useRenderElement(View, componentProps, {
    state,
    ref,
    enabled: shouldRender,
    props: [props, elementProps, { children: wrappedChildren }],
  });
}

export interface CollapsiblePanelState extends CollapsibleRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * The measured natural height of the panel contents, or `undefined` before
   * the first measurement.
   */
  height: number | undefined;
  /**
   * The measured natural width of the panel contents, or `undefined` before
   * the first measurement.
   */
  width: number | undefined;
}

export interface CollapsiblePanelProps
  extends BaseUIComponentProps<typeof View, CollapsiblePanelState> {
  /**
   * Whether to keep the element rendered while the panel is closed.
   *
   * Required to animate the panel closed: React Native cannot report when a
   * closing animation has finished, so an unmounted panel disappears at once.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace CollapsiblePanel {
  export type State = CollapsiblePanelState;
  export type Props = CollapsiblePanelProps;
}
