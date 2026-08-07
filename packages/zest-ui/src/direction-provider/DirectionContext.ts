'use client';
import * as React from 'react';
import { I18nManager } from 'react-native';

export type Direction = 'ltr' | 'rtl';

export const DirectionContext = React.createContext<Direction | undefined>(undefined);

/**
 * The writing direction the components should lay themselves out for.
 *
 * Defaults to React Native's own `I18nManager.isRTL`, which is what the platform
 * already flips layout by — so an app that has enabled RTL gets the right
 * behaviour without wrapping anything. Wrap a subtree in `DirectionProvider` to
 * override it, which is what a language switcher inside an LTR app needs.
 */
export function useDirection(): Direction {
  const context = React.useContext(DirectionContext);
  if (context !== undefined) {
    return context;
  }

  return I18nManager.isRTL ? 'rtl' : 'ltr';
}
