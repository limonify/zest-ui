import type * as React from 'react';
import type { ImageStyle, ModalProps, StyleProp, TextStyle, ViewStyle } from 'react-native';

/**
 * Any React Native style value accepted by Zest components.
 */
export type ZestStyleValue = StyleProp<ViewStyle | TextStyle | ImageStyle>;

/**
 * Props forwarded to the React Native `Modal` that every popup family's
 * `Portal` renders.
 *
 * `visible` and `children` are omitted because the Portal owns them: visibility
 * follows the popup's open state, and the children are the popup's own parts.
 * Everything else is yours, including `animationType`, which defaults to
 * `'none'` so nothing competes with the enter/exit you drive yourself. Pass
 * `'fade'` or `'slide'` to hand the transition back to the platform.
 *
 * `onRequestClose` is *chained*, not replaced: yours runs first, then Zest's own
 * handler closes the popup with the `escape-key` reason.
 *
 * Two of the defaults are load-bearing for anchored popups — `transparent`
 * (so the backdrop shows the app underneath) and `statusBarTranslucent` (which
 * makes the Modal's origin the top of the screen, the coordinate space
 * `useAnchorPositioning` measures anchors in). Override them only deliberately.
 */
export type ZestPortalModalProps = Omit<ModalProps, 'visible' | 'children'>;

/**
 * Style accepted by Zest components. React Native style prop, or a function of
 * the component's state (the RN analogue of Base UI's CSS `data-*` selectors).
 */
export type ZestStyle<State> =
  | ZestStyleValue
  | ((state: State) => ZestStyleValue | undefined)
  | undefined;

/**
 * Events emitted by Zest components carry a `preventZestUIHandler` method that
 * cancels Zest's own internal handling of the event (same contract as Base UI).
 */
export type ZestUIEvent<E> = E & {
  preventZestUIHandler: () => void;
  readonly baseUIHandlerPrevented?: boolean;
};

/**
 * Adds a `preventZestUIHandler` method to all event handler props.
 */
export type WithZestUIEvent<T> = {
  [K in keyof T]: T[K] extends ((event: infer E) => any) | undefined
    ? E extends object
      ? ((event: ZestUIEvent<E>) => any) | undefined
      : T[K]
    : T[K];
};

export type ComponentRenderFn<Props, State> = (
  props: Props,
  state: State,
) => React.ReactElement;

export type RenderProp<Props, State> =
  | React.ReactElement
  | ComponentRenderFn<Props, State>;

/**
 * Internal, untyped view of the props that flow through the render engine.
 */
export type NativeProps = Record<string, any>;

/**
 * Shape of the props shared by every Zest component.
 *
 * @template C The default React Native component type (e.g. `typeof View`).
 * @template State The component's state, passed to `className`/`style`/`render` functions.
 */
export type ZestUIComponentProps<
  C extends React.ElementType,
  State,
  RenderFunctionProps = NativeProps,
> = Omit<WithZestUIEvent<React.ComponentPropsWithRef<C>>, 'style' | 'children' | 'className'> & {
  /**
   * A string, or a function of the component's state returning a string.
   * Inert in plain React Native; consumed by className-based styling
   * solutions such as NativeWind or Uniwind.
   */
  className?: string | ((state: State) => string | undefined) | undefined;
  /**
   * A React Native style, or a function of the component's state returning one.
   */
  style?: ZestStyle<State>;
  /**
   * Allows you to replace the component's rendered element with a different
   * element, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render?: RenderProp<RenderFunctionProps, State> | undefined;
  children?: React.ReactNode;
};

export type Orientation = 'horizontal' | 'vertical';
