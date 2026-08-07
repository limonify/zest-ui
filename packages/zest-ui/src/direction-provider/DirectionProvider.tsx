'use client';
import type * as React from 'react';
import { DirectionContext, type Direction } from './DirectionContext';

/**
 * Sets the writing direction for everything inside it.
 * Doesn't render its own element.
 *
 * Without one, components follow React Native's `I18nManager.isRTL`. Use this
 * when a subtree's direction differs from the app's — an app that ships both
 * Arabic and English without restarting, or a preview pane.
 *
 * It only changes what zest *derives* from direction: which edge `align="start"`
 * anchors a popup to, and which way a horizontal slider's value grows. React
 * Native mirrors the layout itself, and this does not (and cannot) turn that on.
 */
export function DirectionProvider(props: DirectionProvider.Props) {
  const { direction, children } = props;

  return <DirectionContext.Provider value={direction}>{children}</DirectionContext.Provider>;
}

export interface DirectionProviderProps {
  /**
   * The writing direction to apply to the subtree.
   */
  direction: Direction;
  children?: React.ReactNode;
}

export namespace DirectionProvider {
  export type Props = DirectionProviderProps;
}
