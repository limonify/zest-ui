'use client';
import * as React from 'react';
import type { CompositeItemKey, CompositeMetadata } from '../../internals/composite/list/CompositeListContext';
import type { TabsTab } from '../tab/TabsTab';
import type { TabsRoot } from './TabsRoot';

export type TabMap = Map<CompositeItemKey, CompositeMetadata<TabsTab.Metadata>>;

export interface TabsRootContext {
  /**
   * The currently active tab's value.
   */
  value: TabsTab.Value;
  /**
   * Callback for setting a new value.
   */
  onValueChange: (value: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => void;
  /**
   * The component orientation (layout flow direction).
   */
  orientation: TabsRoot.Orientation;
  /**
   * The position of the active tab relative to the previously active tab.
   */
  tabActivationDirection: TabsTab.ActivationDirection;
  setTabMap: (map: TabMap) => void;
  /**
   * Gets the registered metadata — including the measured layout — of the tab
   * with the given value.
   */
  getTabMetadataByValue: (
    value: TabsTab.Value | undefined,
  ) => CompositeMetadata<TabsTab.Metadata> | undefined;
  /**
   * Gets the `nativeID` of the Tab that corresponds to the given Panel value.
   */
  getTabIdByPanelValue: (panelValue: TabsTab.Value) => string | undefined;
  /**
   * Gets the `nativeID` of the Panel that corresponds to the given Tab value.
   */
  getTabPanelIdByValue: (tabValue: TabsTab.Value) => string | undefined;
  registerMountedTabPanel: (panelValue: TabsTab.Value, panelId: string) => () => void;
}

export const TabsRootContext = React.createContext<TabsRootContext | undefined>(undefined);

export function useTabsRootContext() {
  const context = React.useContext(TabsRootContext);
  if (context === undefined) {
    throw new Error('Zest: TabsRootContext is missing. Tabs parts must be placed within <Tabs.Root>.');
  }

  return context;
}
