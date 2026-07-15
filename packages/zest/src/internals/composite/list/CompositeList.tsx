'use client';
import * as React from 'react';
import { useRefWithInit } from '../../../hooks/useRefWithInit';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { useIsoLayoutEffect } from '../../../hooks/useIsoLayoutEffect';
import {
  CompositeListContext,
  type CompositeItemKey,
  type CompositeItemLayout,
  type CompositeMetadata,
} from './CompositeListContext';

interface ItemRecord<Metadata> {
  metadata: Metadata;
  /** Mount order. React runs layout effects in child order, so this is the tree order at mount. */
  registrationIndex: number;
  layout: CompositeItemLayout | undefined;
}

/**
 * Provides context for a list of items in a composite component, assigning each
 * one its index in visual order.
 *
 * The web version sorts by `compareDocumentPosition` and watches for reorders
 * with a `MutationObserver`. React Native has neither a document nor mutation
 * records, so ordering comes from two sources:
 *
 * 1. **Registration order**, which is exact at mount because React runs layout
 *    effects in child order. This is what upstream itself falls back to via
 *    `IndexGuessBehavior.GuessFromOrder`.
 * 2. **Measured layout**, once every item has reported one. Items are then
 *    sorted in reading order, which is the real visual order — it stays correct
 *    under `row-reverse`, wrapping, and absolute positioning, and it repairs the
 *    case registration order cannot see: children reordered without remounting,
 *    which never re-runs an effect but always moves the item on screen.
 *
 * Sorting only switches to layout once *all* items are measured, so the
 * comparator never mixes the two orderings (which could not be transitive).
 */
export function CompositeList<Metadata>(props: CompositeList.Props<Metadata>) {
  const { children, onMapChange: onMapChangeProp } = props;

  const onMapChange = useStableCallback(onMapChangeProp ?? (() => {}));

  const listeners = useRefWithInit(createListeners).current;
  const map = useRefWithInit(createMap<Metadata>).current;
  const nextRegistrationIndexRef = React.useRef(0);

  // `mapTick` is the re-render trigger; `map` itself is stable to avoid
  // reallocating on every registration.
  const [mapTick, setMapTick] = React.useState(0);
  const lastTickRef = React.useRef(mapTick);

  const bumpTick = useStableCallback(() => {
    lastTickRef.current += 1;
    setMapTick(lastTickRef.current);
  });

  const register = useStableCallback((key: CompositeItemKey, metadata: Metadata) => {
    const existing = map.get(key);
    map.set(key, {
      metadata,
      registrationIndex: existing?.registrationIndex ?? nextRegistrationIndexRef.current++,
      layout: existing?.layout,
    });
    bumpTick();
  });

  const unregister = useStableCallback((key: CompositeItemKey) => {
    map.delete(key);
    bumpTick();
  });

  const setItemLayout = useStableCallback((key: CompositeItemKey, layout: CompositeItemLayout) => {
    const existing = map.get(key);
    if (!existing || isSameLayout(existing.layout, layout)) {
      return;
    }

    map.set(key, { ...existing, layout });
    bumpTick();
  });

  const sortedMap = React.useMemo(() => {
    // `mapTick` is the trigger; `map` is stable.
    void mapTick;

    const entries = Array.from(map.entries());
    const allMeasured = entries.every(([, record]) => record.layout !== undefined);

    entries.sort(([, a], [, b]) =>
      allMeasured ? compareReadingOrder(a.layout!, b.layout!) : a.registrationIndex - b.registrationIndex,
    );

    const newMap = new Map<CompositeItemKey, CompositeMetadata<Metadata>>();
    entries.forEach(([key, record], index) => {
      newMap.set(key, { ...record.metadata, index, layout: record.layout });
    });

    return newMap;
  }, [map, mapTick]);

  useIsoLayoutEffect(() => {
    onMapChange(sortedMap);
    listeners.forEach((listener) => listener(sortedMap));
  }, [onMapChange, listeners, sortedMap]);

  const subscribeMapChange = useStableCallback(
    (fn: (newMap: Map<CompositeItemKey, CompositeMetadata<Metadata>>) => void) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  );

  const contextValue: CompositeListContext<Metadata> = React.useMemo(
    () => ({ register, unregister, setItemLayout, subscribeMapChange }),
    [register, unregister, setItemLayout, subscribeMapChange],
  );

  return (
    <CompositeListContext.Provider value={contextValue}>{children}</CompositeListContext.Provider>
  );
}

/**
 * Reading order: items whose vertical extents overlap are on the same row and
 * sort left to right; otherwise the higher one comes first. A plain `y` compare
 * would misorder a row whose items differ in height or vertical alignment.
 */
function compareReadingOrder(a: CompositeItemLayout, b: CompositeItemLayout) {
  const aBottom = a.y + a.height;
  const bBottom = b.y + b.height;
  const overlapsVertically = a.y < bBottom && b.y < aBottom;

  if (overlapsVertically) {
    return a.x - b.x;
  }

  return a.y - b.y;
}

function isSameLayout(a: CompositeItemLayout | undefined, b: CompositeItemLayout) {
  return a != null && a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function createMap<Metadata>() {
  return new Map<CompositeItemKey, ItemRecord<Metadata>>();
}

function createListeners() {
  return new Set<(map: Map<CompositeItemKey, any>) => void>();
}

export interface CompositeListProps<Metadata> {
  children: React.ReactNode;
  onMapChange?:
    | ((newMap: Map<CompositeItemKey, CompositeMetadata<Metadata>>) => void)
    | undefined;
}

export namespace CompositeList {
  export type Props<Metadata> = CompositeListProps<Metadata>;
}
