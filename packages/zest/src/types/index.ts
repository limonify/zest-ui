import type * as React from 'react';
import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native';

/**
 * Any React Native style value accepted by Zest components.
 */
export type ZestStyleValue = StyleProp<ViewStyle | TextStyle | ImageStyle>;

/**
 * Style accepted by Zest components. React Native style prop, or a function of
 * the component's state (the RN analogue of Base UI's CSS `data-*` selectors).
 */
export type ZestStyle<State> =
  | ZestStyleValue
  | ((state: State) => ZestStyleValue | undefined)
  | undefined;

/**
 * Events emitted by Zest components carry a `preventBaseUIHandler` method that
 * cancels Zest's own internal handling of the event (same contract as Base UI).
 */
export type BaseUIEvent<E> = E & {
  preventBaseUIHandler: () => void;
  readonly baseUIHandlerPrevented?: boolean;
};

/**
 * Adds a `preventBaseUIHandler` method to all event handler props.
 */
export type WithBaseUIEvent<T> = {
  [K in keyof T]: T[K] extends ((event: infer E) => any) | undefined
    ? E extends object
      ? ((event: BaseUIEvent<E>) => any) | undefined
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
export type BaseUIComponentProps<
  C extends React.ElementType,
  State,
  RenderFunctionProps = NativeProps,
> = Omit<WithBaseUIEvent<React.ComponentPropsWithRef<C>>, 'style' | 'children' | 'className'> & {
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
