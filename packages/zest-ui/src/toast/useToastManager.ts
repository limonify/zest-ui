'use client';
import * as React from 'react';
import { useToastProviderContext } from './provider/ToastProviderContext';

/**
 * Returns the array of toasts and methods to manage them.
 */
export function useToastManager<Data extends object = any>(): UseToastManagerReturnValue<Data> {
  const store = useToastProviderContext();

  const toasts = store.useState('toasts');

  return React.useMemo(
    () => ({
      toasts,
      add: store.addToast,
      close: store.closeToast,
      remove: store.removeToast,
      update: store.updateToast,
      promise: store.promiseToast,
    }),
    [toasts, store],
  );
}

export interface ToastObject<Data extends object> {
  /**
   * The unique identifier for the toast.
   */
  id: string;
  /**
   * The title of the toast.
   */
  title?: React.ReactNode;
  /**
   * The type of the toast. Used to conditionally style the toast,
   * including conditionally rendering elements based on the type.
   */
  type?: string | undefined;
  /**
   * The description of the toast.
   */
  description?: React.ReactNode;
  /**
   * The amount of time (in ms) before the toast is auto dismissed.
   * A value of `0` will prevent the toast from being dismissed automatically.
   * @default 5000
   */
  timeout?: number | undefined;
  /**
   * The priority of the toast.
   * - `low` - The toast will be announced politely.
   * - `high` - The toast will be announced urgently.
   * @default 'low'
   */
  priority?: 'low' | 'high' | undefined;
  /**
   * The transition status of the toast.
   */
  transitionStatus?: 'starting' | 'ending' | undefined;
  /**
   * A counter that increments whenever the toast is updated or upserted.
   */
  updateKey?: number | undefined;
  /**
   * Determines if the toast was limited because the toast limit was exceeded.
   */
  limited?: boolean | undefined;
  /**
   * The height of the toast.
   */
  height?: number | undefined;
  /**
   * Callback function to be called when the toast is closed.
   */
  onClose?: (() => void) | undefined;
  /**
   * Callback function to be called when the toast is removed from the list after any animations are complete when closed.
   */
  onRemove?: (() => void) | undefined;
  /**
   * Custom data for the toast.
   */
  data?: Data | undefined;
}

export interface UseToastManagerReturnValue<Data extends object = any> {
  toasts: ToastObject<Data>[];
  add: <T extends Data = Data>(options: ToastManagerAddOptions<T>) => string;
  close: (toastId?: string) => void;
  /**
   * Removes a toast from the list outright. Only needed when a `Toast.Root` sets
   * `removeOnClose={false}` to animate its exit: call this once the animation
   * finishes.
   */
  remove: (toastId: string) => void;
  update: <T extends Data = Data>(toastId: string, options: ToastManagerUpdateOptions<T>) => void;
  promise: <Value, T extends Data = Data>(
    promise: Promise<Value>,
    options: ToastManagerPromiseOptions<Value, T>,
  ) => Promise<Value>;
}

export interface ToastManagerAddOptions<Data extends object> extends Omit<
  ToastObject<Data>,
  'id' | 'height' | 'limited' | 'updateKey'
> {
  /**
   * The unique identifier for the toast. Adding a toast with an existing ID
   * updates it in place and refreshes its auto-dismiss timer.
   */
  id?: string | undefined;
}

export interface ToastManagerUpdateOptions<Data extends object> extends Partial<
  Omit<ToastObject<Data>, 'id' | 'height' | 'transitionStatus' | 'limited' | 'updateKey'>
> {}

export interface ToastManagerPromiseOptions<Value, Data extends object> {
  loading: string | ToastManagerUpdateOptions<Data>;
  success:
    | string
    | ToastManagerUpdateOptions<Data>
    | ((result: Value) => string | ToastManagerUpdateOptions<Data>);
  error:
    | string
    | ToastManagerUpdateOptions<Data>
    | ((error: any) => string | ToastManagerUpdateOptions<Data>);
}
