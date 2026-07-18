'use client';
import * as React from 'react';

/**
 * Items are keyed by a stable object identity rather than an element: React
 * Native has no `Element` to use as a map key.
 */
export type CompositeItemKey = object;

export interface CompositeItemLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CompositeMetadata<CustomMetadata> = {
  index?: number | null | undefined;
  layout?: CompositeItemLayout | undefined;
} & CustomMetadata;

export interface CompositeListContext<Metadata = any> {
  register: (key: CompositeItemKey, metadata: Metadata) => void;
  unregister: (key: CompositeItemKey) => void;
  setItemLayout: (key: CompositeItemKey, layout: CompositeItemLayout) => void;
  subscribeMapChange: (
    fn: (map: Map<CompositeItemKey, CompositeMetadata<Metadata>>) => void,
  ) => () => void;
}

export const CompositeListContext = React.createContext<CompositeListContext<any> | undefined>(
  undefined,
);

export function useCompositeListContext<Metadata = any>() {
  const context = React.useContext<CompositeListContext<Metadata> | undefined>(
    CompositeListContext,
  );
  if (context === undefined) {
    throw new Error('Zest: CompositeListContext is missing. Items must be within a CompositeList.');
  }

  return context;
}
