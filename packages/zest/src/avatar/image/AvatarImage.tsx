'use client';
import * as React from 'react';
import { Image, type ImageErrorEventData, type NativeSyntheticEvent } from 'react-native';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useTransitionStatus, type TransitionStatus } from '../../internals/useTransitionStatus';
import type { AvatarRootState, ImageLoadingStatus } from '../root/AvatarRoot';
import type { BaseUIComponentProps } from '../../types';

/**
 * The image to be displayed in the avatar.
 * Renders an `<Image>`.
 *
 * **Diverges from the web deliberately.** Upstream preloads the image with a
 * detached `new Image()` and does not mount the `<img>` until it has loaded. A
 * React Native `<Image>` only fetches once it is mounted, so there is nothing to
 * preload with — this part stays mounted from the start and reports what it is
 * doing through `imageLoadingStatus` on the state object. Hiding it until it has
 * loaded is therefore the consumer's call (and `transitionStatus` is published
 * for fading it in — see the animation contract).
 */
export function AvatarImage(componentProps: AvatarImage.Props) {
  const { className, render, style, onLoadingStatusChange, ref, ...elementProps } = componentProps;

  const { setImageLoadingStatus } = useAvatarRootContext();

  const [imageLoadingStatus, setStatus] = React.useState<ImageLoadingStatus>('idle');

  // Only `transitionStatus` is useful here: upstream's `mounted` exists to keep
  // the img in the tree until an exit animation finishes, and this part never
  // leaves the tree.
  const { transitionStatus } = useTransitionStatus(imageLoadingStatus === 'loaded');

  const publishStatus = useStableCallback((status: ImageLoadingStatus) => {
    setStatus(status);
    onLoadingStatusChange?.(status);
    setImageLoadingStatus(status);
  });

  // The root's status outlives this part, so it has to be reset on unmount or a
  // Fallback would keep believing an image is still loaded.
  useIsoLayoutEffect(() => {
    return () => setImageLoadingStatus('idle');
  }, [setImageLoadingStatus]);

  const state: AvatarImageState = { imageLoadingStatus, transitionStatus };

  return useRenderElement(Image, componentProps, {
    state,
    ref,
    props: [
      {
        onLoadStart() {
          publishStatus('loading');
        },
        onLoad() {
          publishStatus('loaded');
        },
        onError(_event: NativeSyntheticEvent<ImageErrorEventData>) {
          publishStatus('error');
        },
      },
      elementProps,
    ],
  });
}

export interface AvatarImageState extends AvatarRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface AvatarImageProps extends BaseUIComponentProps<typeof Image, AvatarImageState> {
  /**
   * Callback fired when the loading status changes.
   */
  onLoadingStatusChange?: ((status: ImageLoadingStatus) => void) | undefined;
}

export namespace AvatarImage {
  export type State = AvatarImageState;
  export type Props = AvatarImageProps;
}
