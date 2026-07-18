'use client';
import * as React from 'react';
import type { GestureResponderEvent } from 'react-native';
import { useControlled } from '../../hooks/useControlled';
import { useId } from '../../hooks/useId';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useTransitionStatus, type TransitionStatus } from '../../internals/useTransitionStatus';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import type { CollapsibleRoot } from './CollapsibleRoot';

export function useCollapsibleRoot(
  parameters: UseCollapsibleRootParameters,
): UseCollapsibleRootReturnValue {
  const { open: openParam, defaultOpen, onOpenChange, disabled } = parameters;

  const [open, setOpen] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'Collapsible',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, true, true);

  const panelId = useId();

  const handleTrigger = useStableCallback((event: GestureResponderEvent) => {
    const nextOpen = !open;
    const eventDetails = createChangeEventDetails(REASONS.triggerPress, event);

    onOpenChange(nextOpen, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    setOpen(nextOpen);
  });

  return React.useMemo(
    () => ({
      disabled,
      handleTrigger,
      mounted,
      open,
      panelId,
      setMounted,
      setOpen,
      transitionStatus,
    }),
    [disabled, handleTrigger, mounted, open, panelId, setMounted, setOpen, transitionStatus],
  );
}

export interface UseCollapsibleRootParameters {
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
  onOpenChange: (open: boolean, eventDetails: CollapsibleRoot.ChangeEventDetails) => void;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: boolean;
}

export interface UseCollapsibleRootReturnValue {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  handleTrigger: (event: GestureResponderEvent) => void;
  /**
   * Whether the collapsible panel is mounted for transition purposes. This can
   * be `false` while the element remains rendered when `keepMounted` is enabled.
   */
  mounted: boolean;
  /**
   * Whether the collapsible panel is currently open.
   */
  open: boolean;
  panelId: string | undefined;
  setMounted: (nextMounted: boolean) => void;
  setOpen: (open: boolean) => void;
  transitionStatus: TransitionStatus;
}
