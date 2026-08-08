'use client';

// Must come first: everything below is React Native, and reads `__DEV__` while
// it is being evaluated.
import './runtime';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { demos } from './registry';
import type { DemoName } from './names';

/**
 * The browser-only half of a demo.
 *
 * `Slider` and `Drawer` need `GestureHandlerRootView` at the root exactly as
 * they do on a phone, so it wraps every demo here too.
 */
export function DemoStage({ name }: { name: DemoName }) {
  const Component = demos[name];

  if (!Component) {
    return null;
  }

  return (
    <GestureHandlerRootView>
      <Component />
    </GestureHandlerRootView>
  );
}
