'use client';
import * as React from 'react';
import { View } from 'react-native';
import { useRenderElement } from '../../use-render/useRenderElement';
import type { ZestUIComponentProps } from '../../types';
import { AvatarRootContext } from './AvatarRootContext';

/**
 * Displays a user's profile picture, initials, or fallback icon.
 * Renders a `<View>`.
 */
export function AvatarRoot(componentProps: AvatarRoot.Props) {
  const { className, render, style, ref, ...elementProps } = componentProps;

  const [imageLoadingStatus, setImageLoadingStatus] = React.useState<ImageLoadingStatus>('idle');

  const state: AvatarRootState = React.useMemo(
    () => ({ imageLoadingStatus }),
    [imageLoadingStatus],
  );

  const contextValue: AvatarRootContext = React.useMemo(
    () => ({ imageLoadingStatus, setImageLoadingStatus }),
    [imageLoadingStatus],
  );

  const element = useRenderElement(View, componentProps, {
    state,
    ref,
    props: elementProps,
  });

  return <AvatarRootContext.Provider value={contextValue}>{element}</AvatarRootContext.Provider>;
}

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface AvatarRootState {
  /**
   * The image loading status.
   */
  imageLoadingStatus: ImageLoadingStatus;
}

export interface AvatarRootProps extends ZestUIComponentProps<typeof View, AvatarRootState> {}

export namespace AvatarRoot {
  export type State = AvatarRootState;
  export type Props = AvatarRootProps;
  export type LoadingStatus = ImageLoadingStatus;
}
