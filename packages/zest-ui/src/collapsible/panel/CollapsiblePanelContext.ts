'use client';
import * as React from 'react';
import type { TransitionStatus } from '../../internals/useTransitionStatus';

export interface CollapsiblePanelContext {
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
  /**
   * The transition status of the panel, for driving enter/exit animations.
   */
  transitionStatus: TransitionStatus;
}

export const CollapsiblePanelContextContext =
  React.createContext<CollapsiblePanelContext | undefined>(undefined);

export function useCollapsiblePanelState() {
  const context = React.useContext(CollapsiblePanelContextContext);
  if (context === undefined) {
    throw new Error(
      'Zest: CollapsiblePanelContext is missing. Panel state can only be accessed within <Collapsible.Panel> or <Accordion.Panel>.',
    );
  }

  return context;
}
