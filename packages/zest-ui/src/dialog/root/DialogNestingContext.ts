'use client';
import * as React from 'react';

export interface DialogNestingContext {
  /**
   * Called by a nested root as it opens and closes, so the parent can keep a
   * count of how many of its descendants are open.
   */
  onNestedOpenChange: (open: boolean) => void;
}

/**
 * Lets a dialog know it has a dialog above it, and lets a parent know one of its
 * descendants is open.
 *
 * On the web Base UI counts nested dialogs so the one underneath can be scaled
 * back or dimmed. React Native has no CSS to express that, so the count reaches
 * the consumer the way everything else does: as `nested` and `nestedDialogOpen`
 * on the popup and backdrop state.
 */
export const DialogNestingContext = React.createContext<DialogNestingContext | undefined>(
  undefined,
);

export function useDialogNestingContext() {
  return React.useContext(DialogNestingContext);
}
