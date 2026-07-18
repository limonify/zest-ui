'use client';
import * as React from 'react';

export interface SelectGroupContext {
  /**
   * The id the group is labelled by; `Select.GroupLabel` renders it.
   */
  labelId: string | undefined;
}

export const SelectGroupContext = React.createContext<SelectGroupContext | undefined>(undefined);

export function useSelectGroupContext() {
  const context = React.useContext(SelectGroupContext);
  if (context === undefined) {
    throw new Error(
      'Zest: SelectGroupContext is missing. <Select.GroupLabel> must be placed within <Select.Group>.',
    );
  }

  return context;
}
