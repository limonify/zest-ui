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
 * The indent wraps the whole app, so it re-renders its children only when
 * `active` or `frontmostHeight` changes — discrete, once per open or close,
 * never once per swipe frame. The one per-frame field, `swipeProgress`, is a
 * snapshot read at the indent's last render.
 *
 * For a scale that follows the finger *while* the sheet is swiped away, do not
 * style it from `state.swipeProgress` (that would re-render the app every frame).
 * Subscribe to the provider store directly and mirror it into your animation
 * library's shared value instead:
 *
 * ```tsx
 * const store = useDrawerProviderContext();
 * const progress = useSharedValue(0);
 * useEffect(
 *   () => store.subscribe(() => (progress.value = store.state.swipeProgress)),
 *   [store, progress],
 * );
 * ```
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

  // `active` and `frontmostHeight` flip once per open/close, so the indent
  // subscribes to them and re-renders its children for those. `swipeProgress`
  // changes every swipe frame; it is read as a snapshot so a swipe never
  // re-renders the whole app through this part.
  const active = useStoreState(store, 'active');
  const frontmostHeight = useStoreState(store, 'frontmostHeight');
  const swipeProgress = store.select('swipeProgress');

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
