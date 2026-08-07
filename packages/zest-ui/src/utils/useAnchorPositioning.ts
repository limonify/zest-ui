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
import { useDirection } from '../direction-provider/DirectionContext';

export type Side = 'top' | 'right' | 'bottom' | 'left';
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
  const flipsAlignment = direction === 'rtl' && (side === 'top' || side === 'bottom');
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
    resolvedAlignProp === 'center' ? side : (`${side}-${resolvedAlignProp}` as Placement);

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
    positionerStyles,
    refs,
    side: resolvedSide,
    update,
  };
}

function parsePlacement(placement: Placement): [Side, Align] {
  const [side, alignment] = placement.split('-') as [Side, Alignment | undefined];
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

export interface UseAnchorPositioningParameters extends UseAnchorPositioningSharedParameters {}

export interface UseAnchorPositioningReturnValue {
  /**
   * The side the popup was actually placed on, which differs from the requested
   * `side` when `flip` had to move it.
   */
  side: Side;
  /**
   * The alignment the popup was actually placed with.
   */
  align: Align;
  positionerStyles: { position: 'absolute'; left: number; top: number };
  arrowStyles: { left?: number; top?: number };
  arrowRef: React.RefObject<unknown>;
  refs: ReturnType<typeof useFloating>['refs'];
  /**
   * Recomputes the position. Nothing observes layout globally in React Native,
   * so parts call this from their `onLayout`.
   */
  update: () => void;
}
