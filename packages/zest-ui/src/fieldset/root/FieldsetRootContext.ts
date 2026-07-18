'use client';
import * as React from 'react';

export interface FieldsetRootContext {
  /**
   * Whether the fieldset (and every field inside it) is disabled.
   */
  disabled: boolean;
  legendId: string | undefined;
  setLegendId: (id: string | undefined) => void;
}

export const FieldsetRootContext = React.createContext<FieldsetRootContext | undefined>(undefined);

export function useFieldsetRootContext(optional: false): FieldsetRootContext | undefined;
export function useFieldsetRootContext(optional?: true): FieldsetRootContext;
export function useFieldsetRootContext(optional = true): FieldsetRootContext | undefined {
  const context = React.useContext(FieldsetRootContext);
  if (context === undefined && optional) {
    throw new Error(
      'Zest: FieldsetRootContext is missing. Fieldset parts must be placed within <Fieldset.Root>.',
    );
  }

  return context;
}
