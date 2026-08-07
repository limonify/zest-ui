'use client';
import type * as React from 'react';
import { useRefWithInit } from '../../hooks/useRefWithInit';
import { DrawerProviderContext } from './DrawerProviderContext';
import { DrawerProviderStore } from './DrawerProviderStore';

/**
 * Coordinates the drawers under it, so the app behind them can react to one
 * opening.
 * Doesn't render its own element.
 *
 * Put it at the root of the app, above both the drawers and the
 * `Drawer.Indent` that wraps your UI. It is optional: a drawer without one works
 * exactly the same, it just has nothing to indent.
 */
export function DrawerProvider(props: DrawerProvider.Props) {
  const { children } = props;

  const store = useRefWithInit(() => new DrawerProviderStore()).current;

  return <DrawerProviderContext.Provider value={store}>{children}</DrawerProviderContext.Provider>;
}

export interface DrawerProviderProps {
  children?: React.ReactNode;
}

export namespace DrawerProvider {
  export type Props = DrawerProviderProps;
}
