'use client';
import * as React from 'react';
import type { LayoutChangeEvent } from 'react-native';
import type { Align, PhysicalSide } from '../../utils/useAnchorPositioning';

export interface SelectPositionerContext {
  side: PhysicalSide;
  align: Align;
  arrowRef: React.RefObject<unknown>;
  arrowStyles: { left?: number; top?: number };
  /**
   * Spread onto the `Arrow` part so its position is recomputed once it has been
   * measured — see `useAnchorPositioning`.
   */
  onArrowLayout: (event: LayoutChangeEvent) => void;
}

export const SelectPositionerContext = React.createContext<SelectPositionerContext | undefined>(
  undefined,
);

export function useSelectPositionerContext() {
  const context = React.useContext(SelectPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Zest: SelectPositionerContext is missing. <Select.Popup> must be placed within <Select.Positioner>.',
    );
  }

  return context;
}
