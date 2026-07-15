'use client';
import * as React from 'react';
import type { SelectItemState } from './SelectItem';

export interface SelectItemContext {
  state: SelectItemState;
  value: unknown;
}

export const SelectItemContext = React.createContext<SelectItemContext | undefined>(undefined);

export function useSelectItemContext() {
  const context = React.useContext(SelectItemContext);
  if (context === undefined) {
    throw new Error(
      'Zest: SelectItemContext is missing. Select item parts must be placed within <Select.Item>.',
    );
  }

  return context;
}
