'use client';
import * as React from 'react';
import { View } from 'react-native';
import type { ComponentRenderFn, NativeProps, RenderProp, ZestStyle } from '../types';
import {
  useRenderElement,
  type UseRenderElementParameters,
} from './useRenderElement';

/**
 * Renders a Zest element.
 *
 * Public façade over the internal render engine, for consumers building their
 * own Zest-style primitives.
 *
 * @public
 */
export function useRender<
  State extends Record<string, unknown>,
  RenderedElementType,
  Enabled extends boolean | undefined = undefined,
>(
  params: useRender.Parameters<State, RenderedElementType, Enabled>,
): useRender.ReturnValue<Enabled> {
  return useRenderElement(params.defaultComponent ?? View, params, params);
}

export interface UseRenderParameters<
  State,
  RenderedElementType,
  Enabled extends boolean | undefined,
> extends UseRenderElementParameters<State, RenderedElementType, Enabled> {
  /**
   * The React element or a function that returns one to override the default element.
   */
  render?: RenderProp<NativeProps, State> | undefined;
  /**
   * The default React Native component to render when `render` is not provided.
   * @default View
   */
  defaultComponent?: React.ElementType | undefined;
  /**
   * A class name, or a function of the component's state returning one.
   *
   * `useRender` forwards its own parameters to the render engine as the
   * component props, so this is read exactly as it is on a built-in part —
   * declaring it here is what lets a consumer pass their `className` through.
   */
  className?: string | ((state: State) => string | undefined) | undefined;
  /**
   * A React Native style, or a function of the component's state returning one.
   * Composed *after* the styles in `props`, so the consumer's style wins.
   */
  style?: ZestStyle<State>;
}

export type UseRenderReturnValue<Enabled extends boolean | undefined> = Enabled extends false
  ? null
  : React.ReactElement;

export namespace useRender {
  export type RenderProp<TState = Record<string, unknown>> = React.ReactElement | ComponentRenderFn<NativeProps, TState>;

  export type Parameters<
    TState,
    RenderedElementType,
    Enabled extends boolean | undefined,
  > = UseRenderParameters<TState, RenderedElementType, Enabled>;

  export type ReturnValue<Enabled extends boolean | undefined> = UseRenderReturnValue<Enabled>;
}
