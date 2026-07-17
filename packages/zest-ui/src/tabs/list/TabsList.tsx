'use client';
import * as React from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import type { TabsRootState } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import type { ZestUIComponentProps } from '../../types';
import type { TabsTab } from '../tab/TabsTab';
import { TabsListContext } from './TabsListContext';

/**
 * Groups the individual tab buttons.
 * Renders a `<View>`.
 *
 * The web version needs a `ResizeObserver` to keep the indicator in sync; here
 * every tab's `onLayout` already reports size changes to the `CompositeList`.
 */
export function TabsList(componentProps: TabsList.Props) {
  const { className, render, style, ref, ...elementProps } = componentProps;

  const { orientation, setTabMap, tabActivationDirection } = useTabsRootContext();

  const [listSize, setListSize] = React.useState<{ width: number; height: number } | undefined>(
    undefined,
  );

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setListSize((previous) =>
      previous?.width === width && previous?.height === height ? previous : { width, height },
    );
  }, []);

  const contextValue: TabsListContext = React.useMemo(() => ({ listSize }), [listSize]);

  const state: TabsListState = { orientation, tabActivationDirection };

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      { accessibilityRole: 'tablist' as const, 'aria-orientation': orientation, onLayout: handleLayout },
      elementProps,
    ],
  });

  return (
    <TabsListContext.Provider value={contextValue}>
      <CompositeList<TabsTab.Metadata> onMapChange={setTabMap}>{element}</CompositeList>
    </TabsListContext.Provider>
  );
}

export interface TabsListState extends TabsRootState {}

export interface TabsListProps extends ZestUIComponentProps<typeof View, TabsListState> {}

export namespace TabsList {
  export type State = TabsListState;
  export type Props = TabsListProps;
}
