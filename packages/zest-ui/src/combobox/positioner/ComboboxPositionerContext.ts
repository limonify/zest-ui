'use client';
import * as React from 'react';
import type { Align, PhysicalSide } from '../../utils/useAnchorPositioning';

export interface ComboboxPositionerContext {
  side: PhysicalSide;
  align: Align;
}

export const ComboboxPositionerContext = React.createContext<
  ComboboxPositionerContext | undefined
>(undefined);

export function useComboboxPositionerContext() {
  const context = React.useContext(ComboboxPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ComboboxPositionerContext is missing. <Combobox.Popup> must be placed within <Combobox.Positioner>.',
    );
  }

  return context;
}
