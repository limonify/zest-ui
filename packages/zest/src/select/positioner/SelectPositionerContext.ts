'use client';
import * as React from 'react';
import type { Align, Side } from '../../utils/useAnchorPositioning';

export interface SelectPositionerContext {
  side: Side;
  align: Align;
  arrowRef: React.RefObject<unknown>;
  arrowStyles: { left?: number; top?: number };
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
