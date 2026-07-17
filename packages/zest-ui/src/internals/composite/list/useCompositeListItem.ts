'use client';
import * as React from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useIsoLayoutEffect } from '../../../hooks/useIsoLayoutEffect';
import { useRefWithInit } from '../../../hooks/useRefWithInit';
import { useCompositeListContext } from './CompositeListContext';

export interface UseCompositeListItemParameters<Metadata> {
  metadata?: Metadata | undefined;
}

export interface UseCompositeListItemReturnValue {
  /**
   * The item's index in visual order. Starts at the item's registration order
   * and is corrected once the whole list has been measured.
   */
  index: number;
  /**
   * Must be spread onto the item's element so the list can learn where it
   * actually sits on screen.
   */
  onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * Registers a list item with the `CompositeList` and reports its position.
 */
export function useCompositeListItem<Metadata>(
  params: UseCompositeListItemParameters<Metadata> = {},
): UseCompositeListItemReturnValue {
  const { metadata } = params;

  const { register, unregister, setItemLayout, subscribeMapChange } =
    useCompositeListContext<Metadata>();

  // A stable identity for this item instance, standing in for the DOM node the
  // web version keys its map by.
  const key = useRefWithInit(createKey).current;

  const [index, setIndex] = React.useState(-1);

  useIsoLayoutEffect(() => {
    register(key, metadata as Metadata);
    return () => {
      unregister(key);
    };
  }, [register, unregister, key, metadata]);

  useIsoLayoutEffect(() => {
    return subscribeMapChange((map) => {
      const nextIndex = map.get(key)?.index;
      if (nextIndex != null) {
        setIndex(nextIndex);
      }
    });
  }, [subscribeMapChange, key]);

  const onLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      setItemLayout(key, event.nativeEvent.layout);
    },
    [setItemLayout, key],
  );

  return { index, onLayout };
}

function createKey() {
  return {};
}
