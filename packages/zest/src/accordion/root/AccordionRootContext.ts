'use client';
import * as React from 'react';
import type { AccordionRoot, AccordionRootState, AccordionValue } from './AccordionRoot';

export interface AccordionRootContext<Value = any> {
  disabled: boolean;
  handleValueChange: (
    newValue: Value,
    nextOpen: boolean,
    eventDetails: AccordionRoot.ChangeEventDetails,
  ) => void;
  keepMounted: boolean;
  state: AccordionRootState<Value>;
  value: AccordionValue<Value>;
}

export const AccordionRootContext = React.createContext<AccordionRootContext<any> | undefined>(
  undefined,
);

export function useAccordionRootContext<Value = any>() {
  const context = React.useContext<AccordionRootContext<Value> | undefined>(AccordionRootContext);
  if (context === undefined) {
    throw new Error(
      'Zest: AccordionRootContext is missing. Accordion parts must be placed within <Accordion.Root>.',
    );
  }

  return context;
}
