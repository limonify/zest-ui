import type * as React from 'react';
import type { ZestUIEvent, NativeProps, WithZestUIEvent } from '../types';

type ElementType = React.ElementType;
type PropsOf<T extends React.ElementType> = WithZestUIEvent<React.ComponentPropsWithRef<T>>;
type InputProps<T extends React.ElementType> =
  | PropsOf<T>
  | ((otherProps: PropsOf<T>) => PropsOf<T>)
  | undefined;

const EMPTY_PROPS = {};

/* eslint-disable id-denylist */
/**
 * Merges multiple sets of React props. It follows the Object.assign pattern where the rightmost object's fields overwrite
 * the conflicting ones from others. This doesn't apply to event handlers, `className` and `style` props.
 *
 * Event handlers are merged and called in right-to-left order (rightmost handler executes first, leftmost last).
 * For React synthetic events, the rightmost handler can prevent prior (left-positioned) handlers from executing
 * by calling `event.preventZestUIHandler()`.
 *
 * The `className` prop is merged by concatenating classes in right-to-left order (rightmost class appears first in the string).
 * The `style` prop is merged by composing a React Native style array `[left, right]`, so the rightmost styles win
 * when React Native flattens the array.
 *
 * Props can either be provided as objects or as functions that take the previous props as an argument.
 *
 * @important **`ref` is not merged.**
 * @public
 */
export function mergeProps<T extends ElementType>(
  a: InputProps<T>,
  b: InputProps<T>,
  c: InputProps<T>,
  d: InputProps<T>,
  e: InputProps<T>,
): PropsOf<T>;
export function mergeProps<T extends ElementType>(
  a: InputProps<T>,
  b: InputProps<T>,
  c: InputProps<T>,
  d: InputProps<T>,
): PropsOf<T>;
export function mergeProps<T extends ElementType>(
  a: InputProps<T>,
  b: InputProps<T>,
  c: InputProps<T>,
): PropsOf<T>;
export function mergeProps<T extends ElementType>(a: InputProps<T>, b: InputProps<T>): PropsOf<T>;
export function mergeProps(a: any, b: any, c?: any, d?: any, e?: any) {
  if (!c && !d && !e && !a) {
    return createInitialMergedProps(b);
  }

  // We need to mutably own `merged`.
  let merged = createInitialMergedProps(a);

  if (b) {
    merged = mergeInto(merged, b);
  }
  if (c) {
    merged = mergeInto(merged, c);
  }
  if (d) {
    merged = mergeInto(merged, d);
  }
  if (e) {
    merged = mergeInto(merged, e);
  }

  return merged;
}
/* eslint-enable id-denylist */

/**
 * Merges an arbitrary number of React props using the same logic as {@link mergeProps}.
 * This function accepts an array of props instead of individual arguments.
 *
 * @param props Array of props to merge.
 * @returns The merged props.
 * @see mergeProps
 * @public
 */
export function mergePropsN<T extends ElementType>(props: InputProps<T>[]): PropsOf<T> {
  if (props.length === 0) {
    return EMPTY_PROPS as PropsOf<T>;
  }
  if (props.length === 1) {
    return createInitialMergedProps(props[0]) as PropsOf<T>;
  }

  // We need to mutably own `merged`.
  let merged = createInitialMergedProps(props[0]);

  for (let i = 1; i < props.length; i += 1) {
    merged = mergeInto(merged, props[i]);
  }

  return merged as PropsOf<T>;
}

function createInitialMergedProps<T extends ElementType>(inputProps: InputProps<T>) {
  if (isPropsGetter(inputProps)) {
    // Getter-returned handlers intentionally keep their existing semantics.
    return { ...resolvePropsGetter(inputProps, EMPTY_PROPS) };
  }

  return copyInitialProps(inputProps);
}

function mergeInto<T extends ElementType>(merged: Record<string, any>, inputProps: InputProps<T>) {
  if (isPropsGetter(inputProps)) {
    return resolvePropsGetter(inputProps, merged as PropsOf<T>);
  }
  return mutablyMergeInto(merged, inputProps);
}

function copyInitialProps(inputProps: NativeProps | undefined) {
  const copiedProps = { ...inputProps } as Record<string, any>;

  // eslint-disable-next-line guard-for-in
  for (const propName in copiedProps) {
    const propValue = copiedProps[propName];
    if (isEventHandler(propName, propValue)) {
      copiedProps[propName] = wrapEventHandler(propValue);
    }
  }

  return copiedProps;
}

/**
 * Merges two sets of props. In case of conflicts, the external props take precedence.
 */
function mutablyMergeInto(
  mergedProps: Record<string, any>,
  externalProps: NativeProps | undefined,
) {
  if (!externalProps) {
    return mergedProps;
  }

  // eslint-disable-next-line guard-for-in
  for (const propName in externalProps) {
    const externalPropValue = externalProps[propName];

    switch (propName) {
      case 'style': {
        mergedProps[propName] = mergeStyles(mergedProps.style, externalPropValue);
        break;
      }
      case 'className': {
        mergedProps[propName] = mergeClassNames(mergedProps.className, externalPropValue as string);
        break;
      }
      default: {
        if (isEventHandler(propName, externalPropValue)) {
          mergedProps[propName] = mergeEventHandlers(mergedProps[propName], externalPropValue);
        } else {
          mergedProps[propName] = externalPropValue;
        }
      }
    }
  }

  return mergedProps;
}

function isEventHandler(key: string, value: unknown) {
  // This approach is more efficient than using a regex.
  const code0 = key.charCodeAt(0);
  const code1 = key.charCodeAt(1);
  const code2 = key.charCodeAt(2);
  return (
    code0 === 111 /* o */ &&
    code1 === 110 /* n */ &&
    code2 >= 65 /* A */ &&
    code2 <= 90 /* Z */ &&
    (typeof value === 'function' || typeof value === 'undefined')
  );
}

function isPropsGetter<T extends React.ElementType>(
  inputProps: InputProps<T>,
): inputProps is (props: PropsOf<T>) => PropsOf<T> {
  return typeof inputProps === 'function';
}

function resolvePropsGetter<T extends ElementType>(
  inputProps: InputProps<ElementType>,
  previousProps: PropsOf<T>,
) {
  if (isPropsGetter(inputProps)) {
    return inputProps(previousProps);
  }

  return inputProps ?? (EMPTY_PROPS as PropsOf<T>);
}

function mergeEventHandlers(ourHandler: Function | undefined, theirHandler: Function | undefined) {
  if (!theirHandler) {
    return ourHandler;
  }
  if (!ourHandler) {
    return wrapEventHandler(theirHandler);
  }

  return (...args: unknown[]) => {
    const event = args[0];

    if (isSyntheticEvent(event)) {
      const baseUIEvent = event as ZestUIEvent<typeof event>;

      makeEventPreventable(baseUIEvent);

      const result = theirHandler(...args);

      if (!baseUIEvent.baseUIHandlerPrevented) {
        ourHandler?.(...args);
      }

      return result;
    }

    const result = theirHandler(...args);
    ourHandler?.(...args);
    return result;
  };
}

function wrapEventHandler(handler: Function | undefined) {
  if (!handler) {
    return handler;
  }

  return (...args: unknown[]) => {
    const event = args[0];

    if (isSyntheticEvent(event)) {
      makeEventPreventable(event as ZestUIEvent<typeof event>);
    }

    return handler(...args);
  };
}

export function makeEventPreventable<T extends object>(event: ZestUIEvent<T>) {
  event.preventZestUIHandler = () => {
    (event.baseUIHandlerPrevented as boolean) = true;
  };

  return event;
}

/**
 * Composes two React Native styles into an array so the rightmost style wins
 * when flattened. Never object-spreads: styles may be registered StyleSheet
 * IDs or nested arrays.
 */
export function mergeStyles(ourStyle: unknown, theirStyle: unknown) {
  if (ourStyle == null) {
    return theirStyle;
  }
  if (theirStyle == null) {
    return ourStyle;
  }
  return [ourStyle, theirStyle];
}

export function mergeClassNames(
  ourClassName: string | undefined,
  theirClassName: string | undefined,
) {
  if (theirClassName) {
    if (ourClassName) {
      // eslint-disable-next-line prefer-template
      return theirClassName + ' ' + ourClassName;
    }

    return theirClassName;
  }

  return ourClassName;
}

function isSyntheticEvent(event: unknown): event is React.SyntheticEvent {
  return event != null && typeof event === 'object' && 'nativeEvent' in event;
}
