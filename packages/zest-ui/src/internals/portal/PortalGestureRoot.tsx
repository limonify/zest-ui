'use client';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * What every `Portal` puts inside its `Modal`.
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
  return <GestureHandlerRootView style={styles.root}>{props.children}</GestureHandlerRootView>;
}

const styles = StyleSheet.create({
  // The modal's own container is what this replaces, so it fills it exactly.
  root: { flex: 1 },
});
