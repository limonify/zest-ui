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
 * A wrapper for the app's own UI, which reports when a drawer in front of it is
 * open.
 * Renders a `<View>`.
 *
 * This is the iOS-style effect where the app shrinks back as a sheet comes up.
 * Following the animation contract, zest only publishes the numbers — you drive
 * the animation:
 *
 * ```tsx
 * <Drawer.Provider>
 *   <Drawer.IndentBackground style={styles.indentBackground} />
 *   <Drawer.Indent
 *     style={(state) => [
 *       styles.app,
 *       { transform: [{ scale: state.active ? 0.94 : 1 }], borderRadius: state.active ? 16 : 0 },
 *     ]}
 *   >
 *     <App />
 *   </Drawer.Indent>
 *   <Drawer.Root>…</Drawer.Root>
 * </Drawer.Provider>
 * ```
 *
 * `swipeProgress` is what lets the app scale *back* as the sheet is swiped away,
 * rather than snapping at the end.
 *
 * Requires a `Drawer.Provider` above it; without one `active` is always `false`.
 */
export function DrawerIndent(componentProps: DrawerIndent.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const providerStore = useDrawerProviderContext();
  // A provider is optional, so fall back to an inert store of our own rather
  // than branching the hooks.
  const fallbackStore = useRefWithInit(() => new DrawerProviderStore()).current;
  const store = providerStore ?? fallbackStore;

  const active = useStoreState(store, 'active');
  const swipeProgress = useStoreState(store, 'swipeProgress');
  const frontmostHeight = useStoreState(store, 'frontmostHeight');

  const state: DrawerIndentState = React.useMemo(
    () => ({ active, swipeProgress, frontmostHeight }),
    [active, swipeProgress, frontmostHeight],
  );

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });
}

export interface DrawerIndentState {
  /**
   * Whether any drawer under the provider is open.
   */
  active: boolean;
  /**
   * How far the frontmost drawer has been swiped towards dismissal, `0` to `1`.
   * Stays `0` while nothing is being swiped.
   */
  swipeProgress: number;
  /**
   * The measured height of the frontmost drawer's popup, in points. `0` before
   * it has been laid out.
   */
  frontmostHeight: number;
}

export interface DrawerIndentProps extends ZestUIComponentProps<typeof View, DrawerIndentState> {}

export namespace DrawerIndent {
  export type State = DrawerIndentState;
  export type Props = DrawerIndentProps;
}
