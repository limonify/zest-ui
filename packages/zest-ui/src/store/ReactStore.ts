'use client';
import * as React from 'react';
import { Store } from './Store';
import { useStore } from './useStore';
import { useStableCallback } from '../hooks/useStableCallback';
import { useIsoLayoutEffect } from '../hooks/useIsoLayoutEffect';
import { useRefWithInit } from '../hooks/useRefWithInit';
import { NOOP } from '../utils/empty';

function objectKeys<T extends object>(value: T) {
  return Object.keys(value) as Array<keyof T>;
}

/**
 * A Store that supports controlled state keys, non-reactive values and provides utility methods for React.
 *
 * **Diverges from Base UI deliberately.** Upstream hangs the React glue off the class as
 * methods (`store.useState(...)`, `store.useControlledProp(...)`). A class body is not a
 * render scope as far as any Rules-of-Hooks linter is concerned, so every one of those
 * methods reads as a hook called outside a component. The hooks therefore live at module
 * scope in this file and take the store as their first argument — same behaviour, same
 * call order, but the linter can now see that they are ordinary custom hooks. Port
 * upstream store *state* verbatim; wire it up with the functions below.
 */
export class ReactStore<
  State extends object,
  Context = Record<string, never>,
  Selectors extends Record<string, SelectorFunction<State>> = Record<string, never>,
> extends Store<State> {
  /**
   * Creates a new ReactStore instance.
   *
   * @param state Initial state of the store.
   * @param context Non-reactive context values.
   * @param selectors Optional selectors for use with `useStoreState`.
   */
  constructor(state: State, context: Context = {} as Context, selectors?: Selectors) {
    super(state);
    this.context = context;
    this.selectors = selectors;
  }

  /**
   * Non-reactive values such as refs, callbacks, etc.
   */
  readonly context: Context;

  /**
   * @internal Read by `useStoreState`, which lives at module scope and so cannot reach a
   * `private` member. Not part of the public API.
   */
  readonly selectors: Selectors | undefined;

  /** Gets the current value from the store using a selector with the provided key.
   *
   * @param key Key of the selector to use.
   */
  select<Key extends keyof Selectors>(
    key: Key,
    ...args: SelectorArgs<Selectors[Key]>
  ): ReturnType<Selectors[Key]>;

  select(key: keyof Selectors, a1?: unknown, a2?: unknown, a3?: unknown) {
    const selector = this.selectors![key];
    return selector(this.state, a1, a2, a3);
  }

  /**
   * Observes changes derived from the store's selectors and calls the listener when the selected value changes.
   *
   * @param key Key of the selector to observe.
   * @param listener Listener function called when the selector result changes.
   */
  observe<Key extends keyof Selectors>(
    selector: Key,
    listener: (
      newValue: ReturnType<Selectors[Key]>,
      oldValue: ReturnType<Selectors[Key]>,
      store: this,
    ) => void,
  ): () => void;

  observe<Selector extends ObserveSelector<State>>(
    selector: Selector,
    listener: (newValue: ReturnType<Selector>, oldValue: ReturnType<Selector>, store: this) => void,
  ): () => void;

  observe(
    selector: keyof Selectors | ObserveSelector<State>,
    listener: (newValue: any, oldValue: any, store: this) => void,
  ) {
    let selectFn: ObserveSelector<State>;

    if (typeof selector === 'function') {
      selectFn = selector;
    } else {
      selectFn = this.selectors![selector] as ObserveSelector<State>;
    }

    let prevValue = selectFn(this.state);

    listener(prevValue, prevValue, this);

    return this.subscribe((nextState) => {
      const nextValue = selectFn(nextState);
      if (!Object.is(prevValue, nextValue)) {
        const oldValue = prevValue;
        prevValue = nextValue;
        listener(nextValue, oldValue, this);
      }
    });
  }
}

/**
 * Returns a value from the store's state using a selector function.
 * Used to subscribe to specific parts of the state.
 * This hook causes a rerender whenever the selected state changes.
 *
 * @param store The store to read from.
 * @param key Key of the selector to use.
 */
export function useStoreState<
  Selectors extends Record<string, SelectorFunction<any>>,
  Key extends keyof Selectors,
>(
  store: ReactStore<any, any, Selectors>,
  key: Key,
  ...args: SelectorArgs<Selectors[Key]>
): ReturnType<Selectors[Key]>;

export function useStoreState(
  store: ReactStore<any, any, any>,
  key: string,
  a1?: unknown,
  a2?: unknown,
  a3?: unknown,
) {
  React.useDebugValue(key);
  return useStore(store, store.selectors![key], a1, a2, a3);
}

/**
 * Synchronizes a single external value into the store.
 *
 * Note that the while the value in `state` is updated immediately, the value returned
 * by `useStoreState` is updated before the next render (similarly to React's `useState`).
 */
export function useSyncedValue<State extends object, Value>(
  store: ReactStore<State, any, any>,
  key: keyof State,
  value: Value,
) {
  React.useDebugValue(key);

  useIsoLayoutEffect(() => {
    if (store.state[key] !== value) {
      store.set(key, value);
    }
  }, [store, key, value]);
}

/**
 * Synchronizes a single external value into the store and
 * cleans it up (sets to `undefined`) on unmount.
 *
 * Note that the while the value in `state` is updated immediately, the value returned
 * by `useStoreState` is updated before the next render (similarly to React's `useState`).
 */
export function useSyncedValueWithCleanup<
  State extends object,
  Key extends KeysAllowingUndefined<State>,
>(store: ReactStore<State, any, any>, key: Key, value: State[Key]) {
  useIsoLayoutEffect(() => {
    if (store.state[key] !== value) {
      store.set(key, value);
    }

    return () => {
      store.set(key, undefined as State[Key]);
    };
  }, [store, key, value]);
}

/**
 * Synchronizes multiple external values into the store.
 *
 * Note that the while the values in `state` are updated immediately, the values returned
 * by `useStoreState` are updated before the next render (similarly to React's `useState`).
 */
export function useSyncedValues<State extends object>(
  store: ReactStore<State, any, any>,
  statePart: Partial<State>,
) {
  // Both Hooks are called unconditionally so the Hook order stays identical on every render;
  // only the development-only shape check is guarded by `process.env.NODE_ENV`.
  React.useDebugValue(statePart, objectKeys);
  const initialKeys = useRefWithInit(objectKeys, statePart).current;

  if (process.env.NODE_ENV !== 'production') {
    // Check that an object with the same shape is passed on every render
    const nextKeys = Object.keys(statePart);
    if (
      initialKeys.length !== nextKeys.length ||
      initialKeys.some((key, index) => key !== nextKeys[index])
    ) {
      console.error(
        'useSyncedValues expects the same prop keys on every render. Keys should be stable.',
      );
    }
  }

  const dependencies = Object.values(statePart);

  useIsoLayoutEffect(() => {
    store.update(statePart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, ...dependencies]);
}

/**
 * Registers a controllable prop pair (`controlled`, `defaultValue`) for a specific key. If `controlled`
 * is non-undefined, the store's state at `key` is updated to match `controlled`.
 */
export function useControlledProp<State extends object, Value>(
  store: ReactStore<State, any, any>,
  key: keyof State,
  controlled: Value | undefined,
): void {
  React.useDebugValue(key);
  const isControlled = controlled !== undefined;

  useIsoLayoutEffect(() => {
    if (isControlled && !Object.is(store.state[key], controlled)) {
      // Set the internal state to match the controlled value.
      store.setState({ ...store.state, [key]: controlled });
    }
  }, [store, key, controlled, isControlled]);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line
    const cache = ((store as any).controlledValues ??= new Map<keyof State, boolean>());
    if (!cache.has(key)) {
      cache.set(key, isControlled);
    }
    const previouslyControlled = cache.get(key);
    if (previouslyControlled !== undefined && previouslyControlled !== isControlled) {
      console.error(
        `A component is changing the ${
          isControlled ? '' : 'un'
        }controlled state of ${key.toString()} to be ${isControlled ? 'un' : ''}controlled. Elements should not switch from uncontrolled to controlled (or vice versa).`,
      );
    }
  }
}

/**
 * Wraps a function with `useStableCallback` to ensure it has a stable reference
 * and assigns it to the store's context.
 *
 * @param store The store whose context receives the callback.
 * @param key Key of the event callback. Must be a function in the context.
 * @param fn Function to assign.
 */
export function useContextCallback<Context, Key extends ContextFunctionKeys<Context>>(
  store: ReactStore<any, Context, any>,
  key: Key,
  fn: ContextFunction<Context, Key> | undefined,
) {
  React.useDebugValue(key);
  const stableFunction = useStableCallback(fn ?? (NOOP as ContextFunction<Context, Key>));
  (store.context as Record<Key, ContextFunction<Context, Key>>)[key] = stableFunction;
}

function createStateSetter<State extends object, Value>(args: {
  store: ReactStore<State, any, any>;
  key: keyof State;
}) {
  return (value: Value) => {
    args.store.set(args.key, value);
  };
}

/**
 * Returns a stable setter function for a specific key in the store's state.
 * It's commonly used to pass as a ref callback to React elements.
 *
 * @param store The store to set into.
 * @param key Key of the state to set.
 */
export function useStateSetter<State extends object, Value>(
  store: ReactStore<State, any, any>,
  key: keyof State,
) {
  return useRefWithInit(createStateSetter<State, Value>, { store, key }).current;
}

type MaybeCallable = (...args: any[]) => any;

type ContextFunctionKeys<Context> = {
  [Key in keyof Context]-?: Extract<Context[Key], MaybeCallable> extends never ? never : Key;
}[keyof Context];

type ContextFunction<Context, Key extends keyof Context> = Extract<Context[Key], MaybeCallable>;

type KeysAllowingUndefined<State> = {
  [Key in keyof State]-?: undefined extends State[Key] ? Key : never;
}[keyof State];

type ObserveSelector<State> = (state: State) => any;

type SelectorFunction<State> = (state: State, ...args: any[]) => any;

type Tail<T extends readonly any[]> = T extends readonly [any, ...infer Rest] ? Rest : [];

type SelectorArgs<Selector> = Selector extends (...params: infer Params) => any
  ? Tail<Params>
  : never;
