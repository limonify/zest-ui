'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useCollapsibleRootContext } from '../../collapsible/root/CollapsibleRootContext';
import { useCollapsiblePanel, type MeasurePadding } from '../../collapsible/panel/useCollapsiblePanel';
import {
  CollapsiblePanelContextContext,
  type CollapsiblePanelContext,
} from '../../collapsible/panel/CollapsiblePanelContext';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { AccordionItemState } from '../item/AccordionItem';
import { useAccordionItemContext } from '../item/AccordionItemContext';
import { useAccordionRootContext } from '../root/AccordionRootContext';
import type { ZestUIComponentProps } from '../../types';

/**
 * A collapsible panel with the accordion item contents.
 * Renders a `<View>`.
 *
 * Like `Collapsible.Panel`, it publishes the measured content size on the state
 * object so the consumer can drive an `Animated` value from it.
 *
 * ⚠️ **Padding footgun:** The measured `height`/`width` reflects the natural
 * content size of the panel's **children**, not the panel element itself. If you
 * apply `padding` on the Panel element via `style`, the clip height will not
 * account for it and content at the bottom will be clipped. To pad the panel,
 * put padding on a child View **inside** the Panel instead, or use a
 * `measurePadding` prop.
 */
export function AccordionPanel(componentProps: AccordionPanel.Props) {
  const {
    className,
    keepMounted: keepMountedProp,
    measurePadding,
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
    measurePadding,
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
    props: [
      props,
      { role: 'region' as const, accessibilityLabelledBy: triggerId, 'aria-labelledby': triggerId },
      elementProps,
      { children: wrappedChildren },
    ],
  });

  return (
    <CollapsiblePanelContextContext.Provider value={panelContext}>
      {element}
    </CollapsiblePanelContextContext.Provider>
  );
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
  extends ZestUIComponentProps<typeof View, AccordionPanelState> {
  /**
   * Whether to keep the element rendered while the panel is closed.
   *
   * Required to animate the panel closed: React Native cannot report when a
   * closing animation has finished, so an unmounted panel disappears at once.
   * Defaults to the `keepMounted` prop on `Accordion.Root`.
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

export namespace AccordionPanel {
  export type State = AccordionPanelState;
  export type Props = AccordionPanelProps;
}
