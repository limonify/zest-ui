'use client';
import * as React from 'react';

export interface TabsListContext {
  /**
   * The measured size of the list, used by the indicator to derive the active
   * tab's distance from the right and bottom edges.
   */
  listSize: { width: number; height: number } | undefined;
}

export const TabsListContext = React.createContext<TabsListContext | undefined>(undefined);

export function useTabsListContext() {
  const context = React.useContext(TabsListContext);
  if (context === undefined) {
    throw new Error('Zest: TabsListContext is missing. Tabs parts must be placed within <Tabs.List>.');
  }

  return context;
}
