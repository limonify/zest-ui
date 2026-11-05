'use client';
import * as React from 'react';
import { Keyboard, Platform, type KeyboardEvent } from 'react-native';
import type { Padding } from '@floating-ui/react-native';

/**
 * Raises the bottom of the collision boundary by the height of the on-screen
 * keyboard, so `flip` moves the popup above its anchor instead of leaving it, and
 * the input inside it, underneath the keyboard. floating-ui only knows the window.
 *
 * Android has no `keyboardWill*` events, and iOS moves earlier with them. iOS needs
 * the `keyboardDid*` events as well: a list that opens on focus mounts after
 * `keyboardWillShow` has fired and before `Keyboard.metrics()` has a value, which
 * only `keyboardDidShow` sets, so this is the first it hears of that keyboard.
 */
export function useKeyboardCollisionPadding(collisionPadding: Padding): Padding {
  const [keyboardHeight, setKeyboardHeight] = React.useState(
    () => Keyboard.metrics()?.height ?? 0,
  );

  React.useEffect(() => {
    const show = (event: KeyboardEvent) => setKeyboardHeight(event.endCoordinates.height);
    const hide = () => setKeyboardHeight(0);

    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', show),
      Keyboard.addListener('keyboardDidHide', hide),
    ];
    if (Platform.OS === 'ios') {
      subscriptions.push(
        Keyboard.addListener('keyboardWillShow', show),
        Keyboard.addListener('keyboardWillHide', hide),
      );
    }

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  return React.useMemo(() => {
    if (keyboardHeight === 0) {
      return collisionPadding;
    }

    return typeof collisionPadding === 'number'
      ? {
          top: collisionPadding,
          right: collisionPadding,
          bottom: collisionPadding + keyboardHeight,
          left: collisionPadding,
        }
      : { ...collisionPadding, bottom: (collisionPadding.bottom ?? 0) + keyboardHeight };
  }, [collisionPadding, keyboardHeight]);
}
