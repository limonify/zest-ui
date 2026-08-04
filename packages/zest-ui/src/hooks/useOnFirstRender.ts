'use client';
import * as React from 'react';

/**
 * Runs `fn` during the first render, before the tree is committed.
 *
 * Backed by `useState`'s lazy initializer rather than a ref flipped mid-render: render has
 * to stay pure, since React may replay or discard it, and a ref written during a render
 * that never commits leaks into the next attempt. Under StrictMode React deliberately calls
 * the initializer twice in development, so `fn` must tolerate running more than once.
 */
export function useOnFirstRender(fn: Function) {
  React.useState(() => {
    fn();
    return null;
  });
}
