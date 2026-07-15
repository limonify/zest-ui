'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { useCollapsiblePanel } from '../../collapsible/panel/useCollapsiblePanel';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { AccordionItemState } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import type { BaseUIComponentProps } from '../../types';

/**
 * A collapsible panel with the accordion item contents.
 * Renders a `<View>`.
 *
 * Like `Collapsible.Panel`, it publishes the measured content size on the state
 * object so the consumer can drive an `Animated` value from it.
 */
export function AccordionPanel(componentProps: AccordionPanel.Props) {
  const {
    className,
    keepMounted: keepMountedProp,
    render,
    style,
    ref,
    children,
    ...elementProps
  } = componentProps;

  const { keepMounted: contextKeepMounted } = useAccordionRootContext();
  const { transitionStatus } = useCollapsibleRootContext();
  const { state: itemState, triggerId } = useAccordionItemContext();

  const keepMounted = keepMountedProp ?? contextKeepMounted;

  const { dimensions, props, shouldRender, wrappedChildren } = useCollapsiblePanel({
    keepMounted,
    children,
  });

  const state: AccordionPanelState = React.useMemo(
    () => ({
      ...itemState,
      transitionStatus,
      height: dimensions.height,
      width: dimensions.width,
    }),
    [itemState, transitionStatus, dimensions.height, dimensions.width],
  );

  return useRenderElement(View, componentProps, {
    state,
    ref,
    enabled: shouldRender,
    props: [
      props,
      { role: 'region' as const, accessibilityLabelledBy: triggerId, 'aria-labelledby': triggerId },
      elementProps,
      { children: wrappedChildren },
    ],
  });
}

export interface AccordionPanelState extends AccordionItemState {
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

export interface AccordionPanelProps
  extends BaseUIComponentProps<typeof View, AccordionPanelState> {
  /**
   * Whether to keep the element rendered while the panel is closed.
   *
   * Required to animate the panel closed: React Native cannot report when a
   * closing animation has finished, so an unmounted panel disappears at once.
   * Defaults to the `keepMounted` prop on `Accordion.Root`.
   */
  keepMounted?: boolean | undefined;
}

export namespace AccordionPanel {
  export type State = AccordionPanelState;
  export type Props = AccordionPanelProps;
}
