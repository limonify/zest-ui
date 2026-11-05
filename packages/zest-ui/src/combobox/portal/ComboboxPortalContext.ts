'use client';
import * as React from 'react';

export const ComboboxPortalContext = React.createContext<boolean | undefined>(undefined);

/**
 * Whether this subtree is inside a portal rendered as a `Modal`, as opposed to
 * the non-Modal overlay. `Combobox.Input` needs to know to hand its `autoFocus`
 * to the Modal's `onShow`.
 */
export const ComboboxPortalModalContext = React.createContext(false);

export function useComboboxPortalContext() {
  const context = React.useContext(ComboboxPortalContext);
  if (context === undefined) {
    throw new Error(
      'Zest: ComboboxPortalContext is missing. <Combobox.Positioner> must be placed within <Combobox.Portal>.',
    );
  }

  return context;
}
