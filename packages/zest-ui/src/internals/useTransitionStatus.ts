'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '../hooks/useIsoLayoutEffect';
import { AnimationFrame } from '../hooks/useAnimationFrame';

export type TransitionStatus = 'starting' | 'ending' | 'idle' | undefined;

/**
 * Provides a status string for animations.
 *
 * On the web this drives CSS transitions. In React Native there is no CSS, so
 * components surface `transitionStatus` on their state object and the consumer
 * drives an `Animated` value from it.
 *
 * @param open - a boolean that determines if the element is open.
 * @param enableIdleState - a boolean that enables the `'idle'` state between `'starting'` and `'ending'`
 * @param deferEndingState - defers the `'ending'` state by a frame.
 */
export function useTransitionStatus(
  open: boolean,
  enableIdleState: boolean = false,
  deferEndingState: boolean = false,
) {
  const [transitionStatus, setTransitionStatus] = React.useState<TransitionStatus>(
    open && enableIdleState ? 'idle' : undefined,
  );
  const [mounted, setMounted] = React.useState(open);

  useIsoLayoutEffect(() => {
    if (open && !mounted) {
      setMounted(true);
      setTransitionStatus('starting');
    } else if (!open && mounted && transitionStatus !== 'ending' && !deferEndingState) {
      setTransitionStatus('ending');
    } else if (!open && !mounted && transitionStatus === 'ending') {
      setTransitionStatus(undefined);
    }
  }, [open, mounted, transitionStatus, deferEndingState]);

  useIsoLayoutEffect(() => {
    if (!open && mounted && transitionStatus !== 'ending' && deferEndingState) {
      const frame = AnimationFrame.request(() => {
        setTransitionStatus('ending');
      });

      return () => {
        AnimationFrame.cancel(frame);
      };
    }

    return undefined;
  }, [open, mounted, transitionStatus, deferEndingState]);

  useIsoLayoutEffect(() => {
    if (!open || enableIdleState) {
      return undefined;
    }

    const frame = AnimationFrame.request(() => {
      setTransitionStatus(undefined);
    });

    return () => {
      AnimationFrame.cancel(frame);
    };
  }, [enableIdleState, open]);

  useIsoLayoutEffect(() => {
    if (!open || !enableIdleState) {
      return undefined;
    }

    if (open && mounted && transitionStatus !== 'idle') {
      setTransitionStatus('starting');
    }

    const frame = AnimationFrame.request(() => {
      setTransitionStatus('idle');
    });

    return () => {
      AnimationFrame.cancel(frame);
    };
  }, [enableIdleState, open, mounted, transitionStatus]);

  return {
    mounted,
    setMounted,
    transitionStatus,
  };
}
