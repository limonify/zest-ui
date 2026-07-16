'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useTimeout } from '../../hooks/useTimeout';
import type { AvatarRootState } from '../root/AvatarRoot';
import type { ZestUIComponentProps } from '../../types';

/**
 * Rendered when the image fails to load or when no image is provided.
 * Renders a `<View>`.
 */
export function AvatarFallback(componentProps: AvatarFallback.Props) {
  const { className, render, delay = 0, style, ref, ...elementProps } = componentProps;

  const { imageLoadingStatus } = useAvatarRootContext();

  const [delayPassed, setDelayPassed] = React.useState(delay === 0);
  const timeout = useTimeout();

  React.useEffect(() => {
    if (delay > 0) {
      timeout.start(delay, () => setDelayPassed(true));
    } else {
      // Once the fallback is shown without a delay, keep it visible. Otherwise a
      // later change from no delay to a number would re-hide an already-visible
      // fallback.
      setDelayPassed(true);
    }
    return timeout.clear;
  }, [timeout, delay]);

  const state: AvatarFallbackState = { imageLoadingStatus };

  return useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
    enabled: imageLoadingStatus !== 'loaded' && (delay === 0 || delayPassed),
  });
}

export interface AvatarFallbackState extends AvatarRootState {}

export interface AvatarFallbackProps
  extends ZestUIComponentProps<typeof View, AvatarFallbackState> {
  /**
   * How long to wait before showing the fallback. Specified in milliseconds.
   * @default 0
   */
  delay?: number | undefined;
}

export namespace AvatarFallback {
  export type State = AvatarFallbackState;
  export type Props = AvatarFallbackProps;
}
