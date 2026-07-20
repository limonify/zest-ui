'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';
import type { CollapsibleRootState } from '../root/CollapsibleRoot';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { ZestUIComponentProps } from '../../types';
import { useCollapsiblePanel, type MeasurePadding } from './useCollapsiblePanel';
import {
  CollapsiblePanelContextContext,
  type CollapsiblePanelContext,
} from './CollapsiblePanelContext';

/**
 * A panel with the collapsible contents.
 * Renders a `<View>`.
 *
 * The panel measures its natural content size and publishes it on the state
 * object as `height`/`width` — the React Native counterpart of the web version's
 * `--collapsible-panel-height` CSS variable. Drive an `Animated` value from
 * `state.height` and `state.transitionStatus` to animate the panel.
 *
 * ⚠️ **Padding footgun:** The measured `height`/`width` reflects the natural
 * content size of the panel's **children**, not the panel element itself. If you
 * apply `padding` on the Panel element via `style`, the clip height will not
 * account for it and content at the bottom will be clipped. To pad the panel,
 * put padding on a child View **inside** the Panel instead, or use a
 * `measurePadding` prop. See `Accordion.Panel` for the same caveat.
 */
export function CollapsiblePanel(componentProps: CollapsiblePanel.Props) {
  const {
    className,
    keepMounted = false,
    measurePadding,
    render,
    style,
    ref,
    children,
    ...elementProps
  } = componentProps;

  const { state: rootState, transitionStatus } = useCollapsibleRootContext();

  const { dimensions, props, shouldRender, wrappedChildren } = useCollapsiblePanel({
    keepMounted,
    measurePadding,
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

  const panelContext: CollapsiblePanelContext = React.useMemo(
    () => ({
      height: dimensions.height,
      width: dimensions.width,
      transitionStatus,
    }),
    [dimensions.height, dimensions.width, transitionStatus],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    enabled: shouldRender,
    props: [props, elementProps, { children: wrappedChildren }],
  });

  return (
    <CollapsiblePanelContextContext.Provider value={panelContext}>
      {element}
    </CollapsiblePanelContextContext.Provider>
  );
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
  extends ZestUIComponentProps<typeof View, CollapsiblePanelState> {
  /**
   * Whether to keep the element rendered while the panel is closed.
   *
   * Required to animate the panel closed: React Native cannot report when a
   * closing animation has finished, so an unmounted panel disappears at once.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * Padding applied to the inner measurement wrapper so the reported
   * `height`/`width` reflect the padded content size.
   *
   * Use this instead of `style.padding` on the panel element to avoid the
   * padding footgun where the clip height does not account for padding.
   * The padding is applied inside the clip, so the animation height
   * naturally includes it.
   */
  measurePadding?: MeasurePadding | undefined;
}

export namespace CollapsiblePanel {
  export type State = CollapsiblePanelState;
  export type Props = CollapsiblePanelProps;
}
