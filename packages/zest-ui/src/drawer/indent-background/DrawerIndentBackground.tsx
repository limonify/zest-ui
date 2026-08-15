'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useDrawerProviderContext } from '../provider/DrawerProviderContext';
import { DrawerProviderStore } from '../provider/DrawerProviderStore';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { useStoreState } from '../../store/ReactStore';
import type { ZestUIComponentProps } from '../../types';

/**
 * The surface revealed behind `Drawer.Indent` as the app shrinks back.
 * Renders a `<View>`.
 *
 * Render it before the indent and give it a background — it is what shows in the
 * gap the scaled-down app leaves at the edges of the screen. It publishes the
 * same state, so it can fade in with the indent.
 */
export function DrawerIndentBackground(componentProps: DrawerIndentBackground.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const providerStore = useDrawerProviderContext();
  const fallbackStore = useRefWithInit(() => new DrawerProviderStore()).current;
  const store = providerStore ?? fallbackStore;

  // Same decoupling as `Drawer.Indent`: only `active` is reactive; `swipeProgress`
  // is a snapshot so the background does not re-render once per swipe frame.
  const active = useStoreState(store, 'active');
  const swipeProgress = store.select('swipeProgress');

  const state: DrawerIndentBackgroundState = React.useMemo(
    () => ({ active, swipeProgress }),
    [active, swipeProgress],
  );

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });
}

export interface DrawerIndentBackgroundState {
  /**
   * Whether any drawer under the provider is open.
   */
  active: boolean;
  /**
   * How far the frontmost drawer has been swiped towards dismissal, `0` to `1`.
   */
  swipeProgress: number;
}

export interface DrawerIndentBackgroundProps
  extends ZestUIComponentProps<typeof View, DrawerIndentBackgroundState> {}

export namespace DrawerIndentBackground {
  export type State = DrawerIndentBackgroundState;
  export type Props = DrawerIndentBackgroundProps;
}
