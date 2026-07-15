'use client';
import { StyleSheet, View } from 'react-native';
import { useToastProviderContext } from '../provider/ToastProviderContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { BaseUIComponentProps } from '../../types';

/**
 * A container viewport for toasts.
 * Renders a `<View>` that fills its parent without intercepting touches.
 *
 * **This is the one popup family that is not an RN `Modal`, and deliberately so.**
 * A `Modal` covers the screen and swallows every touch, which is right for a
 * dialog and fatal for a toast: the app underneath has to stay usable while a
 * toast is on screen. So there is no `Toast.Portal` either — place the Viewport
 * inside `Toast.Provider`, at the root of the app, and position it with your own
 * styles. `pointerEvents="box-none"` is what lets touches through everywhere
 * except on the toasts themselves.
 *
 * Upstream's viewport also runs focus management, hover tracking and a
 * `ScrollArea`-like keyboard flow (F6). None of that is ported: see the store.
 */
export function ToastViewport(componentProps: ToastViewport.Props) {
  const { render, className, style, ref, ...elementProps } = componentProps;

  const store = useToastProviderContext();
  const toasts = store.useState('toasts');
  const expanded = store.useState('expanded');

  const state: ToastViewportState = {
    empty: toasts.length === 0,
    expanded,
  };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        style: StyleSheet.absoluteFill,
        // Touches pass through the viewport to the app, but not through the
        // toasts inside it.
        pointerEvents: 'box-none' as const,
        accessibilityLiveRegion: 'polite' as const,
      },
      elementProps,
    ],
  });
}

export interface ToastViewportState {
  /**
   * Whether there are no toasts.
   */
  empty: boolean;
  /**
   * Whether a toast is being pressed or focused, which pauses the timers.
   */
  expanded: boolean;
}

export interface ToastViewportProps
  extends BaseUIComponentProps<typeof View, ToastViewportState> {}

export namespace ToastViewport {
  export type State = ToastViewportState;
  export type Props = ToastViewportProps;
}
