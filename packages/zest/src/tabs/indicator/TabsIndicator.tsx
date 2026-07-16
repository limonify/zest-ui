'use client';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { useTabsListContext } from '../list/TabsListContext';
import type { TabsTab } from '../tab/TabsTab';
import type { ZestUIComponentProps } from '../../types';

/**
 * A visual indicator that can be styled to match the position of the currently
 * active tab.
 * Renders a `<View>`.
 *
 * Where the web version writes `--active-tab-left` and friends as CSS variables,
 * this publishes the same numbers on its state object; position it yourself from
 * `style={(state) => ...}`.
 *
 * The measurements come from each tab's `onLayout`, which reports a position
 * relative to the tab's **parent**. They are therefore accurate when the tabs are
 * direct children of `<Tabs.List>` — the standard structure. Wrapping tabs in
 * intermediate views offsets them.
 */
export function TabsIndicator(componentProps: TabsIndicator.Props) {
  const { className, render, style, ref, ...elementProps } = componentProps;

  const { getTabMetadataByValue, orientation, tabActivationDirection, value } = useTabsRootContext();
  const { listSize } = useTabsListContext();

  const activeTabLayout = value == null ? undefined : getTabMetadataByValue(value)?.layout;
  const isTabSelected = activeTabLayout != null;

  const left = activeTabLayout?.x ?? 0;
  const top = activeTabLayout?.y ?? 0;
  const width = activeTabLayout?.width ?? 0;
  const height = activeTabLayout?.height ?? 0;
  const right = listSize ? listSize.width - left - width : 0;
  const bottom = listSize ? listSize.height - top - height : 0;

  const state: TabsIndicatorState = {
    orientation,
    selectedTabPosition: isTabSelected ? { left, right, top, bottom } : null,
    selectedTabSize: isTabSelected ? { width, height } : null,
    tabActivationDirection,
  };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    // Nothing to point at until a tab has been selected and measured.
    enabled: isTabSelected,
    props: [{ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const }, elementProps],
  });
}

export interface TabsIndicatorState {
  /**
   * The component orientation.
   */
  orientation: TabsRoot.Orientation;
  /**
   * The position of the active tab within its list.
   */
  selectedTabPosition: TabsTab.Position | null;
  /**
   * The size of the active tab.
   */
  selectedTabSize: TabsTab.Size | null;
  /**
   * The direction used for tab activation.
   */
  tabActivationDirection: TabsTab.ActivationDirection;
}

export interface TabsIndicatorProps
  extends ZestUIComponentProps<typeof View, TabsIndicatorState> {}

export namespace TabsIndicator {
  export type State = TabsIndicatorState;
  export type Props = TabsIndicatorProps;
}
