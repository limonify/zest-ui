'use client';
import * as React from 'react';
import {
  arrow,
  flip,
  limitShift,
  offset,
  shift,
  useFloating,
  type Middleware,
  type Padding,
  type Placement,
} from '@floating-ui/react-native';
import type { LayoutChangeEvent } from 'react-native';
import { AnimationFrame } from '../hooks/useAnimationFrame';
import { useIsoLayoutEffect } from '../hooks/useIsoLayoutEffect';
import { useDirection, type Direction } from '../direction-provider/DirectionContext';

/**
 * A physical side, or a logical one that follows the writing direction:
 * `inline-start` is the left in LTR and the right in RTL.
 */
export type Side = 'top' | 'right' | 'bottom' | 'left' | 'inline-start' | 'inline-end';

/** The physical side a `Side` resolves to, which is what floating-ui places by. */
export type PhysicalSide = 'top' | 'right' | 'bottom' | 'left';

function resolveSide(side: Side, direction: Direction): PhysicalSide {
  if (side === 'inline-start') {
    return direction === 'rtl' ? 'right' : 'left';
  }
  if (side === 'inline-end') {
    return direction === 'rtl' ? 'left' : 'right';
  }
  return side;
}
export type Align = 'start' | 'center' | 'end';

/**
 * Positions a floating element against an anchor.
 *
 * Upstream vendors `floating-ui-react` and drives it from
 * `utils/useAnchorPositioning.ts`. Here the same engine is used through its
 * official React Native binding, so `flip`/`shift`/`limitShift`/`arrow`
 * behave identically instead of being re-derived.
 *
 * `sameScrollView: false` makes floating-ui measure the anchor with
 * `measureInWindow` (and add the Android status bar height), producing screen
 * coordinates. Popups therefore have to be rendered in a container whose origin
 * is the top of the screen — which is what a `statusBarTranslucent` `Modal` is.
 *
 * There is no `autoUpdate` equivalent: nothing in React Native observes layout
 * globally. Call `update()` whenever the anchor or the popup is laid out — the
 * parts wire this to their `onLayout`.
 */
export function useAnchorPositioning(
  params: UseAnchorPositioningParameters = {},
): UseAnchorPositioningReturnValue {
  const {
    align = 'center',
    alignOffset = 0,
    arrowPadding = 5,
    collisionPadding = 5,
    open = false,
    side = 'bottom',
    sideOffset = 0,
    sticky = false,
  } = params;

  const arrowRef = React.useRef<unknown>(null);

  const direction = useDirection();

  // `start`/`end` are writing-direction relative, and only along the horizontal
  // axis — which is the cross axis when the popup sits above or below its
  // anchor. `@floating-ui/react-native` has no direction option, so the swap
  // happens here, in the placement itself.
  const physicalSide = resolveSide(side, direction);

  const flipsAlignment =
    direction === 'rtl' && (physicalSide === 'top' || physicalSide === 'bottom');
  const resolvedAlignProp: Align = flipsAlignment
    ? align === 'start'
      ? 'end'
      : align === 'end'
        ? 'start'
        : 'center'
    : align;
  // The cross-axis offset is measured along that same mirrored axis.
  const resolvedAlignOffset = flipsAlignment ? -alignOffset : alignOffset;

  const placement: Placement =
    resolvedAlignProp === 'center'
      ? physicalSide
      : (`${physicalSide}-${resolvedAlignProp}` as Placement);

  const middleware: Middleware[] = React.useMemo(
    () => [
      offset({ mainAxis: sideOffset, crossAxis: resolvedAlignOffset }, [
        sideOffset,
        resolvedAlignOffset,
      ]),
      flip({ padding: collisionPadding }, [collisionPadding]),
      shift(
        {
          padding: collisionPadding,
          // `sticky` keeps the popup glued to the anchor even as it slides out of
          // view; otherwise `limitShift` stops it at the anchor's edge.
          limiter: sticky ? undefined : limitShift(),
        },
        [collisionPadding, sticky],
      ),
      arrow({ element: arrowRef, padding: arrowPadding }, [arrowPadding]),
    ],
    [sideOffset, resolvedAlignOffset, collisionPadding, sticky, arrowPadding],
  );

  const floating = useFloating({ placement, middleware, sameScrollView: false });

  const { x, y, placement: resolvedPlacement, middlewareData, refs, update } = floating;

  const [resolvedSide, physicalAlign] = parsePlacement(resolvedPlacement);

  // Report the alignment in the same vocabulary the consumer wrote it in: they
  // asked for `start`, so a collision that moved it should say `end`, not
  // whichever physical edge RTL happens to put `start` on.
  const flipsResolvedAlignment =
    direction === 'rtl' && (resolvedSide === 'top' || resolvedSide === 'bottom');
  const resolvedAlign: Align = flipsResolvedAlignment
    ? physicalAlign === 'start'
      ? 'end'
      : physicalAlign === 'end'
        ? 'start'
        : 'center'
    : physicalAlign;

  const positionerStyles = React.useMemo(
    () => ({ position: 'absolute' as const, left: x, top: y }),
    [x, y],
  );

  // Re-measure every time the popup opens. The anchor's screen position is read
  // at compute time, and nothing in React Native observes layout globally — so
  // after the page behind has scrolled, a popup whose content stayed mounted
  // would otherwise reopen at wherever its trigger was the *last* time it
  // opened. The extra frame covers the case where the Modal has not laid its
  // children out yet when the effect runs.
  useIsoLayoutEffect(() => {
    if (!open) {
      return undefined;
    }

    update();
    const frame = AnimationFrame.request(update);

    return () => {
      AnimationFrame.cancel(frame);
    };
  }, [open, update]);

  // Recompute once the arrow has a size, and only then: `update()` feeds back
  // into this layout, so an unguarded call would loop.
  const arrowSizeRef = React.useRef({ width: 0, height: 0 });
  const onArrowLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width === arrowSizeRef.current.width && height === arrowSizeRef.current.height) {
        return;
      }
      arrowSizeRef.current = { width, height };
      update();
    },
    [update],
  );

  const arrowStyles = React.useMemo(() => {
    const data = middlewareData.arrow;
    if (!data) {
      return {};
    }

    return {
      ...(data.x != null ? { left: data.x } : {}),
      ...(data.y != null ? { top: data.y } : {}),
    };
  }, [middlewareData.arrow]);

  return {
    align: resolvedAlign,
    arrowRef,
    arrowStyles,
    onArrowLayout,
    positionerStyles,
    refs,
    side: resolvedSide,
    update,
  };
}

function parsePlacement(placement: Placement): [PhysicalSide, Align] {
  const [side, alignment] = placement.split('-') as [PhysicalSide, Alignment | undefined];
  return [side, alignment ?? 'center'];
}

type Alignment = 'start' | 'end';

export interface UseAnchorPositioningSharedParameters {
  /**
   * Which side of the anchor to position against.
   * @default 'bottom'
   */
  side?: Side | undefined;
  /**
   * Distance between the anchor and the popup, in points.
   * @default 0
   */
  sideOffset?: number | undefined;
  /**
   * How to align the popup relative to the anchor.
   * @default 'center'
   */
  align?: Align | undefined;
  /**
   * Additional offset along the alignment axis, in points.
   * @default 0
   */
  alignOffset?: number | undefined;
  /**
   * Minimum distance to keep between the popup and the edge of the screen.
   * @default 5
   */
  collisionPadding?: Padding | undefined;
  /**
   * Whether to keep the popup anchored even when it would slide off screen,
   * instead of stopping it at the anchor's edge.
   * @default false
   */
  sticky?: boolean | undefined;
  /**
   * Minimum distance to keep between the arrow and the popup's corners.
   * @default 5
   */
  arrowPadding?: number | undefined;
}

export interface UseAnchorPositioningParameters extends UseAnchorPositioningSharedParameters {
  /**
   * Whether the popup is open. Opening re-measures the anchor, which is what
   * keeps a popup whose content stays mounted from reopening at the position
   * its trigger had the last time — after the page behind it has scrolled, for
   * instance.
   */
  open?: boolean | undefined;
}

export interface UseAnchorPositioningReturnValue {
  /**
   * The side the popup was actually placed on, which differs from the requested
   * `side` when `flip` had to move it.
   */
  side: PhysicalSide;
  /**
   * The alignment the popup was actually placed with.
   */
  align: Align;
  positionerStyles: { position: 'absolute'; left: number; top: number };
  arrowStyles: { left?: number; top?: number };
  arrowRef: React.RefObject<unknown>;
  /**
   * Must be spread onto the `Arrow` part.
   *
   * floating-ui's `arrow` middleware needs the arrow element to exist and to
   * have been measured, and on React Native measuring is asynchronous. The
   * first position is computed as soon as the anchor and the popup have their
   * refs — before the arrow has laid out — and nothing observes layout globally
   * to try again. Without this the middleware returns no data and the arrow
   * sits in the popup's top-left corner.
   */
  onArrowLayout: (event: LayoutChangeEvent) => void;
  refs: ReturnType<typeof useFloating>['refs'];
  /**
   * Recomputes the position. Nothing observes layout globally in React Native,
   * so parts call this from their `onLayout`.
   */
  update: () => void;
}
