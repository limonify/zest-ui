'use client';
import * as React from 'react';
import { useWindowDimensions } from 'react-native';
import { useDrawerRootContext } from './DrawerRootContext';
import type { DrawerSnapPoint } from './DrawerRootContext';

export interface ResolvedDrawerSnapPoint {
  value: DrawerSnapPoint;
  /**
   * How much of the popup is visible at this snap point, in pixels.
   */
  height: number;
  /**
   * How far the popup is pushed off the edge at this snap point, in pixels.
   * This is what the consumer translates by.
   */
  offset: number;
}

/**
 * Damps the swipe once the drag overshoots the fully-open edge (`nextOffset < 0`),
 * so the popup resists travelling past it instead of tearing off the screen.
 * Ported from upstream verbatim.
 */
export function getSnapPointSwipeMovement(baseOffset: number, movementValue: number): number {
  const nextOffset = baseOffset + movementValue;
  if (nextOffset >= 0) {
    return movementValue;
  }

  return -Math.sqrt(-nextOffset) - baseOffset;
}

/**
 * Turns a snap point into a visible height: a number `<= 1` is a fraction of the
 * viewport, anything larger is a pixel value.
 *
 * **Diverges from upstream:** it accepts `'148px'`/`'30rem'` strings too. React
 * Native styles are unitless numbers and it has no root font size, so a string
 * form would have nothing to resolve against — zest takes numbers only.
 */
export function resolveSnapPointHeight(snapPoint: DrawerSnapPoint, viewportHeight: number) {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0 || !Number.isFinite(snapPoint)) {
    return null;
  }

  if (snapPoint <= 1) {
    return clamp(snapPoint, 0, 1) * viewportHeight;
  }

  return snapPoint;
}

/** The index of the value closest to `target`, or `-1` when there are none. */
export function closestSnapPointIndex(values: number[], target: number): number {
  let closestIndex = -1;
  let closestDistance = Number.POSITIVE_INFINITY;

  values.forEach((value, index) => {
    const distance = Math.abs(value - target);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

export function resolveSnapPoints(
  snapPoints: readonly DrawerSnapPoint[] | undefined,
  popupHeight: number,
  viewportHeight: number,
): ResolvedDrawerSnapPoint[] {
  if (!snapPoints || snapPoints.length === 0 || viewportHeight <= 0 || popupHeight <= 0) {
    return [];
  }

  const maxHeight = Math.min(popupHeight, viewportHeight);
  if (!Number.isFinite(maxHeight) || maxHeight <= 0) {
    return [];
  }

  const resolved = snapPoints
    .map((value): ResolvedDrawerSnapPoint | null => {
      const resolvedHeight = resolveSnapPointHeight(value, viewportHeight);
      if (resolvedHeight === null || !Number.isFinite(resolvedHeight)) {
        return null;
      }

      const height = clamp(resolvedHeight, 0, maxHeight);
      return { value, height, offset: Math.max(0, popupHeight - height) };
    })
    .filter((point): point is ResolvedDrawerSnapPoint => point !== null);

  if (resolved.length <= 1) {
    return resolved;
  }

  // Two snap points that land within a pixel of each other would make the
  // closest-point search ambiguous. Later duplicates win, matching upstream.
  const deduped: ResolvedDrawerSnapPoint[] = [];
  const seenHeights: number[] = [];

  for (let index = resolved.length - 1; index >= 0; index -= 1) {
    const point = resolved[index]!;
    if (seenHeights.some((height) => Math.abs(height - point.height) <= 1)) {
      continue;
    }

    seenHeights.push(point.height);
    deduped.push(point);
  }

  deduped.reverse();
  return deduped;
}

/**
 * Resolves the drawer's snap points against the measured popup and the window.
 *
 * Upstream measures the viewport element and watches it with a `ResizeObserver`.
 * React Native has `useWindowDimensions`, which already re-renders on rotation —
 * and a drawer's Modal is full-screen (`statusBarTranslucent`), so the window
 * *is* the viewport.
 */
export function useDrawerSnapPoints() {
  const { snapPoints, activeSnapPoint, setActiveSnapPoint, popupHeight, snapToSequentialPoints } =
    useDrawerRootContext();

  const { height: viewportHeight } = useWindowDimensions();

  const resolvedSnapPoints = React.useMemo(
    () => resolveSnapPoints(snapPoints, popupHeight, viewportHeight),
    [snapPoints, popupHeight, viewportHeight],
  );

  const activeResolvedSnapPoint = React.useMemo(() => {
    if (resolvedSnapPoints.length === 0) {
      return undefined;
    }

    if (activeSnapPoint === undefined) {
      return resolvedSnapPoints[0];
    }

    if (activeSnapPoint === null) {
      return undefined;
    }

    const exactMatch = resolvedSnapPoints.find((point) => Object.is(point.value, activeSnapPoint));
    if (exactMatch) {
      return exactMatch;
    }

    // A snap point that is not one of `snapPoints` still resolves, to whichever
    // of them it lands nearest.
    const resolvedHeight = resolveSnapPointHeight(activeSnapPoint, viewportHeight);
    if (resolvedHeight === null) {
      return undefined;
    }

    const height = clamp(resolvedHeight, 0, Math.min(popupHeight, viewportHeight));
    const index = closestSnapPointIndex(
      resolvedSnapPoints.map((point) => point.height),
      height,
    );

    return resolvedSnapPoints[index];
  }, [activeSnapPoint, popupHeight, resolvedSnapPoints, viewportHeight]);

  return {
    snapPoints,
    snapToSequentialPoints,
    activeSnapPoint,
    setActiveSnapPoint,
    resolvedSnapPoints,
    activeSnapPointOffset: activeResolvedSnapPoint?.offset ?? null,
    hasSnapPoints: resolvedSnapPoints.length > 0,
  };
}

function clamp(value: number, lower: number, upper: number) {
  return Math.min(Math.max(value, lower), upper);
}
