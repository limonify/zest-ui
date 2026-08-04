'use client';
import * as React from 'react';
import { View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { useMenuPortalContext } from '../../menu/portal/MenuPortalContext';
import { MenuPositionerContext } from '../../menu/positioner/MenuPositionerContext';
import { useContextMenuRootContext } from '../root/ContextMenuRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { ZestUIComponentProps } from '../../types';
import { useStoreState } from '../../store/ReactStore';

const NO_ARROW = { current: null };

/**
 * Positions the context menu popup at the point the long press landed.
 * Renders a `<View>`.
 *
 * Unlike `Menu.Positioner` it anchors to a screen point rather than a trigger
 * element, so it does not go through `useAnchorPositioning`: floating-ui
 * measures a real node, and there is no node here. Collision handling is
 * therefore its own — the popup flips to the other side of the press point when
 * it would otherwise run off the screen, and is kept `collisionPadding` inside
 * the edges. `side` and `align` on state report where it actually landed.
 */
export function ContextMenuPositioner(componentProps: ContextMenuPositioner.Props) {
  const {
    render,
    className,
    collisionPadding = 5,
    style,
    ref,
    ...elementProps
  } = componentProps;

  useMenuPortalContext();
  const store = useMenuRootContext();
  const { anchor } = useContextMenuRootContext();

  const open = useStoreState(store, 'open');
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // The popup's own size, which only exists after it has been laid out. Until
  // then it is placed at the press point unflipped, exactly as before.
  const [size, setSize] = React.useState<{ width: number; height: number } | undefined>(undefined);

  const onLayout = React.useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((previous) =>
      previous?.width === width && previous?.height === height ? previous : { width, height },
    );
  }, []);

  // A closed menu remeasures when it reopens somewhere else, so stale geometry
  // never decides the first frame of the next open.
  React.useEffect(() => {
    if (!open) {
      setSize(undefined);
    }
  }, [open]);

  const placement = React.useMemo(() => {
    if (size === undefined) {
      return { left: anchor.x, top: anchor.y, side: 'bottom' as Side, align: 'start' as Align };
    }

    const flipHorizontally = anchor.x + size.width > screenWidth - collisionPadding;
    const flipVertically = anchor.y + size.height > screenHeight - collisionPadding;

    const rawLeft = flipHorizontally ? anchor.x - size.width : anchor.x;
    const rawTop = flipVertically ? anchor.y - size.height : anchor.y;

    // Clamping matters when the popup is larger than the space on either side:
    // flipping alone would just move the overflow to the opposite edge.
    const maxLeft = Math.max(collisionPadding, screenWidth - size.width - collisionPadding);
    const maxTop = Math.max(collisionPadding, screenHeight - size.height - collisionPadding);

    return {
      left: Math.min(Math.max(rawLeft, collisionPadding), maxLeft),
      top: Math.min(Math.max(rawTop, collisionPadding), maxTop),
      side: (flipVertically ? 'top' : 'bottom') as Side,
      align: (flipHorizontally ? 'end' : 'start') as Align,
    };
  }, [anchor.x, anchor.y, size, screenWidth, screenHeight, collisionPadding]);

  const state: ContextMenuPositionerState = {
    open,
    side: placement.side,
    align: placement.align,
  };

  const contextValue: MenuPositionerContext = React.useMemo(
    () => ({
      side: placement.side,
      align: placement.align,
      arrowRef: NO_ARROW,
      arrowStyles: {},
    }),
    [placement.side, placement.align],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: [
      {
        style: { position: 'absolute' as const, left: placement.left, top: placement.top },
        onLayout,
      },
      elementProps,
    ],
  });

  return (
    <MenuPositionerContext.Provider value={contextValue}>
      {element}
    </MenuPositionerContext.Provider>
  );
}

export interface ContextMenuPositionerState {
  open: boolean;
  /**
   * `'bottom'` when the popup hangs below the press point, `'top'` when it was
   * flipped above it to stay on screen.
   */
  side: Side;
  /**
   * `'start'` when the popup extends right of the press point, `'end'` when it
   * was flipped to its left.
   */
  align: Align;
}

export interface ContextMenuPositionerProps
  extends ZestUIComponentProps<typeof View, ContextMenuPositionerState> {
  /**
   * How much space to keep between the popup and the edges of the screen.
   * @default 5
   */
  collisionPadding?: number | undefined;
}

export namespace ContextMenuPositioner {
  export type State = ContextMenuPositionerState;
  export type Props = ContextMenuPositionerProps;
}
