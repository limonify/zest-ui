'use client';
import * as React from 'react';
import { Image, type ImageErrorEventData, type NativeSyntheticEvent } from 'react-native';
import { useAvatarRootContext } from '../root/AvatarRootContext';
import { useRenderElement } from '../../use-render/useRenderElement';
import { useStableCallback } from '../../hooks/useStableCallback';
import { useIsoLayoutEffect } from '../../hooks/useIsoLayoutEffect';
import { useTransitionStatus, type TransitionStatus } from '../../internals/useTransitionStatus';
import type { AvatarRootState, ImageLoadingStatus } from '../root/AvatarRoot';
import type { ZestUIComponentProps } from '../../types';

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
 *
 * **Uses React Native's `Image`, which does not cache across mounts.** Remote
 * avatars therefore refetch whenever this part remounts. zest cannot fix that
 * for you: `expo-image` is a native module whose entry point runs
 * `initObserveIntegrationIfNeeded()` **at import time**, and `src/index.ts`
 * re-exports this file — so importing it here would drag expo-image into every
 * consumer's bundle, including one that only ever renders a `Button`, and crash
 * any app without expo-modules-core. Swap the element instead — the `render`
 * prop replaces it wholesale, and every prop below is forwarded untouched:
 *
 * ```tsx
 * import { Image as ExpoImage } from 'expo-image';
 *
 * <Avatar.Image source={{ uri }} render={<ExpoImage cachePolicy="memory-disk" />} />
 * ```
 *
 * `expo-image` spells `resizeMode` as `contentFit`; the rest of the props used
 * here (`source`, `onLoadStart`, `onLoad`, `onError`) carry over as-is.
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

  // These three have to keep their identity between renders. React Native's own
  // `Image` does not care, but `react-native-web`'s keys the effect that starts
  // the load on them — a fresh closure each render restarts the load, which
  // publishes a status, which renders, which makes fresh closures. That is an
  // infinite loop, and React ends it with "Maximum update depth exceeded".
  const handleLoadStart = useStableCallback(() => publishStatus('loading'));
  const handleLoad = useStableCallback(() => publishStatus('loaded'));
  const handleError = useStableCallback((_event: NativeSyntheticEvent<ImageErrorEventData>) =>
    publishStatus('error'),
  );

  const state: AvatarImageState = { imageLoadingStatus, transitionStatus };

  return useRenderElement(Image, componentProps, {
    state,
    ref,
    props: [
      {
        // An avatar image is content, not decoration: without a role assistive
        // tech has nothing to announce it as. Pass `accessibilityLabel` (or
        // `alt`) for the person it depicts; leave it off and RN treats the
        // image as unlabelled, which is the right default for a decorative one.
        accessibilityRole: 'image' as const,
        onLoadStart: handleLoadStart,
        onLoad: handleLoad,
        onError: handleError,
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

export interface AvatarImageProps extends ZestUIComponentProps<typeof Image, AvatarImageState> {
  /**
   * Callback fired when the loading status changes.
   */
  onLoadingStatusChange?: ((status: ImageLoadingStatus) => void) | undefined;
}

export namespace AvatarImage {
  export type State = AvatarImageState;
  export type Props = AvatarImageProps;
}
