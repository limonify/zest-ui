'use client';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useDirection } from '../../direction-provider/DirectionContext';

/**
 * What every `Portal` puts inside its `Modal`, and the writing direction it lays
 * itself out in.
 *
 * A `Modal` is its own native window, and `react-native-gesture-handler`
 * attaches its recognizer to the root view of the tree it is mounted in — so
 * without one of these, a touch that lands *on the popup* is still delivered to
 * gestures in the app **underneath** it. Tapping a row in an open `Select` over
 * a `Slider` moved the slider; that is the bug this exists to prevent, and it
 * costs the consumer nothing because it lives inside the portal.
 *
 * It is also what makes gestures work *inside* a popup at all — a `Drawer` with
 * a swipeable sheet needs a gesture root in its own window, which is
 * gesture-handler's documented requirement for `Modal`.
 */
export function PortalGestureRoot(props: { children?: React.ReactNode }) {
  // A `Modal` is a new layout root, and a new root takes its direction from
  // `I18nManager`, not from the tree that opened it. So under a
  // `DirectionProvider` that disagrees with the device, every popup laid itself
  // out in the device's direction: its rows, its padding and its text alignment
  // stayed LTR inside an RTL app while the chevrons — which read the context —
  // flipped. Yoga takes `direction` from a real view, so the root carries it.
  const direction = useDirection();
  return <GestureHandlerRootView style={[styles.root, { direction }]}>{props.children}</GestureHandlerRootView>;
}

const styles = StyleSheet.create({
  // The modal's own container is what this replaces, so it fills it exactly.
  root: { flex: 1 },
});
