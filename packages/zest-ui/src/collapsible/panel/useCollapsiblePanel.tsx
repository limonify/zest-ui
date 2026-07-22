'use client';
import * as React from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useCollapsibleRootContext } from '../root/CollapsibleRootContext';

interface Dimensions {
  height: number | undefined;
  width: number | undefined;
}

const EMPTY_DIMENSIONS: Dimensions = { height: undefined, width: undefined };

/**
 * The shared behavior behind `Collapsible.Panel` and `Accordion.Panel`.
 *
 * Upstream's counterpart is ~550 lines that coordinate with CSS transitions and
 * keyframes. React Native has neither, so all that remains is measuring the
 * natural content size and managing the mount lifecycle; the consumer animates.
 */
export function useCollapsiblePanel(parameters: UseCollapsiblePanelParameters) {
  const { keepMounted, measurePadding, children } = parameters;

  const { mounted, open, panelId, setMounted } = useCollapsibleRootContext();

  const [dimensions, setDimensions] = React.useState<Dimensions>(EMPTY_DIMENSIONS);

  // Nothing can report when a closing animation finished, so a panel that isn't
  // kept mounted is torn down as soon as it closes.
  useIsoLayoutEffect(() => {
    if (!open && mounted && !keepMounted) {
      setMounted(false);
    }
  }, [open, mounted, keepMounted, setMounted]);

  const handleContentLayout = React.useCallback((event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    if (height <= 0) return;
    setDimensions((previous) =>
      previous.height === height && previous.width === width ? previous : { height, width },
    );
  }, []);

  const props = React.useMemo(
    () => ({
      nativeID: panelId,
      // Clipping is what makes a collapsed panel collapse; consumers can still
      // override it, since their style is merged after this one.
      style: { overflow: 'hidden' as const },
      'aria-hidden': !open || undefined,
      accessibilityElementsHidden: !open,
      importantForAccessibility: open ? ('auto' as const) : ('no-hide-descendants' as const),
    }),
    [panelId, open],
  );

  // The panel's own size is consumer-driven, so the natural content size has to
  // be measured on an inner element that is never height-constrained.
  // When `measurePadding` is set, it is applied to the inner measurement
  // wrapper so the reported `height`/`width` reflect the padded content size.
  const wrappedChildren = React.useMemo(
    () => (
      <View style={measurePadding} onLayout={handleContentLayout}>
        {children}
      </View>
    ),
    [handleContentLayout, measurePadding, children],
  );

  return {
    dimensions,
    props,
    shouldRender: keepMounted || mounted,
    wrappedChildren,
  };
}

/**
 * Padding insets that are applied to the inner measurement wrapper so the
 * reported `height`/`width` on the panel state reflect the padded content size.
 * Without this, padding on the panel element itself will cause clipped content.
 */
export interface MeasurePadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface UseCollapsiblePanelParameters {
  keepMounted: boolean;
  /**
   * Padding applied to the inner measurement wrapper.
   * Use this instead of `style.padding` on the panel element to avoid the
   * padding footgun where the clip height does not account for padding.
   */
  measurePadding?: MeasurePadding | undefined;
  children: React.ReactNode;
}
