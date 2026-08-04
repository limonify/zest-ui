'use client';
import * as React from 'react';

/**
 * A React.useRef() that is initialized with a function. Note that it accepts an optional
 * initialization argument, so the initialization function doesn't need to be an inline closure.
 *
 * The initial value comes from `useState`'s lazy initializer rather than from a sentinel
 * compared against `ref.current` during render: render has to stay pure, since React may
 * replay or discard it, and a ref written mid-render survives work that never commits.
 * `useState` gives the same "runs once per mount" guarantee without that hazard, and it
 * stays correct when `init` legitimately returns `null` or `undefined`.
 *
 * `init` must therefore be side-effect free — under StrictMode React deliberately calls it
 * twice in development and throws one result away.
 *
 * @usage
 *   const ref = useRefWithInit(sortColumns, columns)
 */
export function useRefWithInit<T>(init: () => T): React.RefObject<T>;
export function useRefWithInit<T, U>(init: (arg: U) => T, initArg: U): React.RefObject<T>;
export function useRefWithInit(init: (arg?: unknown) => unknown, initArg?: unknown) {
  const [initialValue] = React.useState(() => init(initArg));

  // Only the first render's argument is kept; later ones are ignored by `useRef`.
  return React.useRef(initialValue);
}
