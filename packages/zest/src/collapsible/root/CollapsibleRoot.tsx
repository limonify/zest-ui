'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { BaseUIComponentProps } from '../../types';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import type { REASONS } from '../../utils/reasons';
import { useCollapsibleRoot, type UseCollapsibleRootReturnValue } from './useCollapsibleRoot';
import { CollapsibleRootContext } from './CollapsibleRootContext';

/**
 * Groups all parts of the collapsible.
 * Renders a `<View>`.
 */
export function CollapsibleRoot(componentProps: CollapsibleRoot.Props) {
  const {
    className,
    defaultOpen = false,
    disabled = false,
    onOpenChange: onOpenChangeProp,
    open,
    render,
    style,
    ref,
    ...elementProps
  } = componentProps;

  const onOpenChange = useStableCallback(onOpenChangeProp ?? (() => {}));

  const collapsible = useCollapsibleRoot({ open, defaultOpen, onOpenChange, disabled });

  const state: CollapsibleRootState = React.useMemo(
    () => ({
      open: collapsible.open,
      disabled: collapsible.disabled,
      transitionStatus: collapsible.transitionStatus,
    }),
    [collapsible.open, collapsible.disabled, collapsible.transitionStatus],
  );

  const contextValue: CollapsibleRootContext = React.useMemo(
    () => ({ ...collapsible, onOpenChange, state }),
    [collapsible, onOpenChange, state],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });

  return (
    <CollapsibleRootContext.Provider value={contextValue}>{element}</CollapsibleRootContext.Provider>
  );
}

export interface CollapsibleRootState
  extends Pick<UseCollapsibleRootReturnValue, 'open' | 'disabled'> {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface CollapsibleRootProps
  extends BaseUIComponentProps<typeof View, CollapsibleRootState> {
  /**
   * Whether the collapsible panel is currently open.
   *
   * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
   */
  open?: boolean | undefined;
  /**
   * Whether the collapsible panel is initially open.
   *
   * To render a controlled collapsible, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the panel is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: CollapsibleRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export type CollapsibleRootChangeEventReason = typeof REASONS.triggerPress | typeof REASONS.none;

export type CollapsibleRootChangeEventDetails =
  ZestChangeEventDetails<CollapsibleRootChangeEventReason>;

export namespace CollapsibleRoot {
  export type State = CollapsibleRootState;
  export type Props = CollapsibleRootProps;
  export type ChangeEventReason = CollapsibleRootChangeEventReason;
  export type ChangeEventDetails = CollapsibleRootChangeEventDetails;
}
