import * as React from 'react';
import { useMergedRefs, useMergedRefsN } from '../hooks/useMergedRefs';
import { getReactElementRef } from '../utils/getReactElementRef';
import { warn } from '../utils/warn';
import { EMPTY_OBJECT } from '../utils/empty';
import { resolveClassName } from '../utils/resolveClassName';
import { resolveStyle } from '../utils/resolveStyle';
import { mergeProps, mergePropsN, mergeClassNames, mergeStyles } from '../merge-props';
import type { ComponentRenderFn, NativeProps, RenderProp, ZestStyle } from '../types';

/**
 * Renders a Zest element.
 *
 * React Native adaptation of Base UI's `useRenderElement`. Differences from the web version:
 * - The default element is a React Native component (e.g. `View`, `Pressable`) instead of a tag name.
 * - There is no `data-*` attribute generation: state reaches consumers through `className`/`style`
 *   functions, the `render` function's second argument, and each component's explicit
 *   `accessibilityState` props.
 * - `style` values are merged by array composition (RN flattens arrays), never object spreading.
 *
 * @param DefaultComponent The default React Native component to render. Can be overridden by the `render` prop.
 * @param componentProps An object containing the `render`, `className` and `style` props. Other props are ignored.
 * @param params Additional parameters for rendering the element.
 */
export function useRenderElement<
  State extends Record<string, any>,
  RenderedElementType,
  Enabled extends boolean | undefined = undefined,
>(
  DefaultComponent: React.ElementType | undefined,
  componentProps: UseRenderElementComponentProps<State>,
  params: UseRenderElementParameters<State, RenderedElementType, Enabled> = {},
): Enabled extends false ? null : React.ReactElement {
  const renderProp = componentProps.render;
  const outProps = useRenderElementProps(componentProps, params);
  if (params.enabled === false) {
    return null as Enabled extends false ? null : React.ReactElement;
  }

  const state = params.state ?? (EMPTY_OBJECT as State);
  return evaluateRenderProp(DefaultComponent, renderProp, outProps, state) as Enabled extends false
    ? null
    : React.ReactElement;
}

/**
 * Computes render element final props.
 */
function useRenderElementProps<
  State extends Record<string, any>,
  RenderedElementType,
  Enabled extends boolean | undefined,
>(
  componentProps: UseRenderElementComponentProps<State>,
  params: UseRenderElementParameters<State, RenderedElementType, Enabled> = {},
): NativeProps {
  const { className: classNameProp, style: styleProp, render: renderProp } = componentProps;

  const { state = EMPTY_OBJECT as State, ref, props, enabled = true } = params;

  const className = enabled ? resolveClassName(classNameProp, state) : undefined;
  const style = enabled ? resolveStyle(styleProp, state) : undefined;

  // Ensure outProps is always a new mutable object when enabled, never EMPTY_OBJECT,
  // since EMPTY_OBJECT is frozen and mutations would fail in strict mode.
  const outProps: NativeProps = enabled && props ? resolveRenderFunctionProps(props) : {};

  // SAFETY: The `useMergedRefs` functions use a single hook to store the same value,
  // switching between them at runtime is safe. If this assertion fails, React will
  // throw at runtime anyway.
  /* eslint-disable react-hooks/rules-of-hooks */
  if (!enabled) {
    // Called only to keep the hook order stable when disabled; the merged ref is unused.
    void useMergedRefs(null, null);
  } else if (Array.isArray(ref)) {
    outProps.ref = useMergedRefsN([outProps.ref, getReactElementRef(renderProp), ...ref]);
  } else {
    outProps.ref = useMergedRefs(outProps.ref, getReactElementRef(renderProp), ref);
  }
  /* eslint-enable react-hooks/rules-of-hooks */

  if (!enabled) {
    return EMPTY_OBJECT;
  }

  if (className !== undefined) {
    outProps.className = mergeClassNames(outProps.className, className);
  }

  if (style !== undefined) {
    outProps.style = mergeStyles(outProps.style, style);
  }

  return outProps;
}

function resolveRenderFunctionProps(
  props: NonNullable<UseRenderElementParameters<any, any, any>['props']>,
): NativeProps {
  if (Array.isArray(props)) {
    return mergePropsN(props) as NativeProps;
  }

  return mergeProps(undefined, props) as NativeProps;
}

const COMPONENT_IDENTIFIER_PATTERN = /^[A-Z][A-Za-z0-9$]*$/;
const LOWERCASE_CHARACTER_PATTERN = /[a-z]/;

function evaluateRenderProp<State>(
  DefaultComponent: React.ElementType | undefined,
  render: RenderProp<NativeProps, State> | undefined,
  props: NativeProps,
  state: State,
): React.ReactElement {
  if (render) {
    if (typeof render === 'function') {
      if (process.env.NODE_ENV !== 'production') {
        warnIfRenderPropLooksLikeComponent(render);
      }
      return render(props, state);
    }

    const mergedProps = mergeProps(props, render.props as NativeProps);

    mergedProps.ref = props.ref;

    // There is a high number of indirections, the error message thrown by React.cloneElement() is
    // hard to use for developers, this logic provides a better context.
    if (process.env.NODE_ENV !== 'production') {
      if (!React.isValidElement(render)) {
        throw new Error(
          [
            'Zest: The `render` prop was provided an invalid React element as `React.isValidElement(render)` is `false`.',
            'A valid React element must be provided to the `render` prop because it is cloned with props to replace the default element.',
          ].join('\n'),
        );
      }
    }

    return React.cloneElement(render, mergedProps);
  }

  if (DefaultComponent) {
    return React.createElement(DefaultComponent, props);
  }

  throw new Error('Zest: Render element or function are not defined.');
}

function warnIfRenderPropLooksLikeComponent(renderFn: { name: string }) {
  const functionName = renderFn.name;
  if (functionName.length === 0) {
    return;
  }

  if (!COMPONENT_IDENTIFIER_PATTERN.test(functionName)) {
    return;
  }

  if (!LOWERCASE_CHARACTER_PATTERN.test(functionName)) {
    return;
  }

  warn(
    `The \`render\` prop received a function named \`${functionName}\` that starts with an uppercase letter.`,
    'This usually means a React component was passed directly as `render={Component}`.',
    'Zest calls `render` as a plain function, which can break the Rules of Hooks during reconciliation.',
    'If this is an intentional render callback, rename it to start with a lowercase letter.',
    'Use `render={<Component />}` or `render={(props) => <Component {...props} />}` instead.',
  );
}

export type UseRenderElementParameters<
  State,
  RenderedElementType,
  Enabled extends boolean | undefined,
> = {
  /**
   * If `false`, the hook will skip most of its internal logic and return `null`.
   * This is useful for rendering a component conditionally.
   * @default true
   */
  enabled?: Enabled | undefined;
  /**
   * The ref to apply to the rendered element.
   */
  ref?: React.Ref<RenderedElementType> | (React.Ref<RenderedElementType> | undefined)[] | undefined;
  /**
   * The state of the component.
   */
  state?: State | undefined;
  /**
   * Intrinsic props to be spread on the rendered element.
   */
  props?:
    | NativeProps
    | Array<NativeProps | undefined | ((props: NativeProps) => NativeProps)>
    | undefined;
};

export interface UseRenderElementComponentProps<State> {
  /**
   * The class name to apply to the rendered element.
   * Can be a string or a function that accepts the state and returns a string.
   * Inert in plain React Native; consumed by className-based styling solutions.
   */
  className?: string | ((state: State) => string | undefined) | undefined;
  /**
   * The render prop or React element to override the default element.
   */
  render?: undefined | RenderProp<NativeProps, State>;
  /**
   * The style to apply to the rendered element.
   * Can be a React Native style or a function that accepts the state and returns one.
   */
  style?: ZestStyle<State>;
}
