'use client';

import { type ReactElement, cloneElement, useEffect, useRef, useState } from 'react';

/**
 * Web-only docs scaffolding — not part of the library, and not needed on native.
 *
 * This site renders the components through `react-native-web`, where a popup
 * lives in a `position: fixed` Modal and the page behind it still scrolls. A
 * popup is measured in viewport coordinates at open time and nothing re-measures
 * it on scroll (React Native has no `autoUpdate`), so the trigger would scroll
 * away from the popup. This wrapper re-renders its child — a Positioner — on
 * every scroll frame with a sub-pixel `alignOffset` change.
 * `useAnchorPositioning`'s middleware memo depends on `alignOffset`, so the new
 * value re-creates floating-ui's `update`, which makes the open effect re-run
 * and re-measure the trigger at its current position. A closed popup is
 * untouched: the Positioner sits inside a `Portal` that renders nothing until
 * it opens.
 *
 * Native apps never need this: a `Modal` covers the screen, so there is no
 * scrolling page behind an open popup. Copy demos without this wrapper.
 */
export function FollowScroll(props: { children: ReactElement<{ alignOffset?: number }> }) {
  const [tick, setTick] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const schedule = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => setTick((t) => t + 1));
    };

    // Capture phase: a scroll on any scroll container, not just the window,
    // moves the trigger in the viewport, so every one has to re-measure.
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const { children } = props;

  return cloneElement(children, {
    alignOffset: (children.props.alignOffset ?? 0) + (tick % 2) * 1e-9,
  });
}
