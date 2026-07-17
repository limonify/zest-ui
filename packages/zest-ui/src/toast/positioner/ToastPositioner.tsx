'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useToastProviderContext } from '../provider/ToastProviderContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useMergedRefs } from '../../hooks/useMergedRefs';
import {
  useAnchorPositioning,
  type Align,
  type Side,
  type UseAnchorPositioningSharedParameters,
} from '../../utils/useAnchorPositioning';
import type { ZestUIComponentProps } from '../../types';
import { ToastPositionerContext } from './ToastPositionerContext';

/**
 * Positions a toast against an anchor, for a toast that belongs to something on
 * screen rather than to the app as a whole.
 * Renders a `<View>`.
 *
 * **Why this cannot just reuse the other Positioners.** `useAnchorPositioning`
 * measures anchors in screen coordinates, which every other popup family can use
 * as-is because they render inside a `statusBarTranslucent` `Modal` whose origin
 * *is* the screen origin. `Toast.Viewport` is not a Modal — it is an ordinary
 * View that can sit anywhere — so its own screen origin is subtracted here to
 * bring the anchor back into the viewport's coordinate space.
 */
export function ToastPositioner(componentProps: ToastPositioner.Props) {
  const {
    align = 'center',
    alignOffset = 0,
    anchor,
    arrowPadding = 5,
    className,
    collisionPadding = 5,
    render,
    side = 'top',
    sideOffset = 0,
    sticky = false,
    style,
    ref,
    ...elementProps
  } = componentProps;

  const store = useToastProviderContext();
  const viewportOrigin = store.useState('viewportOrigin');

  const positioning = useAnchorPositioning({
    align,
    alignOffset,
    arrowPadding,
    collisionPadding,
    side,
    sideOffset,
    sticky,
  });

  const { arrowRef, arrowStyles, positionerStyles, refs, update } = positioning;

  useIsoLayoutEffect(() => {
    refs.setReference(anchor ?? null);
  }, [refs, anchor]);

  const mergedRef = useMergedRefs(ref, refs.setFloating);

  const viewportRelativeStyles = React.useMemo(
    () => ({
      ...positionerStyles,
      left: positionerStyles.left - viewportOrigin.x,
      top: positionerStyles.top - viewportOrigin.y,
    }),
    [positionerStyles, viewportOrigin],
  );

  const state: ToastPositionerState = { side: positioning.side, align: positioning.align };

  const contextValue: ToastPositionerContext = React.useMemo(
    () => ({ side: positioning.side, align: positioning.align, arrowRef, arrowStyles }),
    [positioning.side, positioning.align, arrowRef, arrowStyles],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref: mergedRef,
    props: [
      {
        style: viewportRelativeStyles,
        onLayout() {
          update();
        },
      },
      elementProps,
    ],
  });

  return (
    <ToastPositionerContext.Provider value={contextValue}>{element}</ToastPositionerContext.Provider>
  );
}

export interface ToastPositionerState {
  side: Side;
  align: Align;
}

export interface ToastPositionerProps
  extends UseAnchorPositioningSharedParameters,
    ZestUIComponentProps<typeof View, ToastPositionerState> {
  /**
   * The element to position the toast against. Unlike the other popup families
   * there is no trigger to infer it from, so it is passed in — usually a ref's
   * `current`.
   */
  anchor?: unknown;
}

export namespace ToastPositioner {
  export type State = ToastPositionerState;
  export type Props = ToastPositionerProps;
}
