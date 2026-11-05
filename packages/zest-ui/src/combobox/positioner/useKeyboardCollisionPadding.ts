'use client';
import * as React from 'react';
import { Keyboard, Platform } from 'react-native';
import type { Padding } from '@floating-ui/react-native';

/**
 * Raises the bottom of the collision boundary by the height of the on-screen
 * keyboard, so `flip` moves the popup above its anchor instead of leaving it, and
 * the input inside it, underneath the keyboard. floating-ui only knows the window.
 *
 * Android has no `keyboardWill*` events, and iOS moves earlier with them.
 */
export function useKeyboardCollisionPadding(collisionPadding: Padding): Padding {
  const [keyboardHeight, setKeyboardHeight] = React.useState(
    () => Keyboard.metrics()?.height ?? 0,
  );

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
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
