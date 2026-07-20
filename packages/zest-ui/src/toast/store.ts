import { createSelector } from '../store/createSelector';
import { ReactStore } from '../store/ReactStore';
import { generateId } from '../utils/generateId';
import { Timeout } from '../hooks/useTimeout';
import type {
  ToastManagerAddOptions,
  ToastManagerPromiseOptions,
  ToastManagerUpdateOptions,
  ToastObject,
} from './useToastManager';
import { resolvePromiseOptions } from './utils/resolvePromiseOptions';

type ToastInternalUpdateOptions<Data extends object> = Partial<Omit<ToastObject<Data>, 'id'>>;

/**
 * React Native adaptation of Base UI's toast store.
 *
 * The queue, the limit and the timer machinery are ported as-is — they are pure
 * state. What is gone is everything that touched the DOM: focus management
 * (`viewport`/`prevFocusElement`, `handleFocusManagement`, `restoreFocusToPrevElement`)
 * and the document pointerdown listener.
 *
 * Two state fields change meaning:
 * - `hovering` becomes `pressed`. A touch screen has no hover, but holding a
 *   finger on a toast is the same intent — do not dismiss this yet.
 * - `isWindowFocused` becomes `isAppActive`, driven by RN's `AppState`, so a
 *   toast does not expire while the app is in the background.
 */
/** The screen coordinates of the viewport's top-left corner. */
export type ToastViewportOrigin = { x: number; y: number };

export type State = {
  toasts: ToastObject<any>[];
  toastMetadata: Map<string, ToastMetadata>;
  pressed: boolean;
  focused: boolean;
  timeout: number;
  limit: number;
  isAppActive: boolean;
  /**
   * Where the viewport sits on screen. `Toast.Positioner` needs it because
   * `useAnchorPositioning` measures anchors in screen coordinates while the
   * viewport — not being a Modal — can be anywhere.
   */
  viewportOrigin: ToastViewportOrigin;
};

type ToastMetadata = {
  value: ToastObject<any>;
  index: number;
  visibleIndex: number;
  offsetY: number;
};

type InitialState = Omit<State, 'toastMetadata'>;

function createToastMetadata(toasts: ToastObject<any>[]) {
  const metadata = new Map<string, ToastMetadata>();
  let visibleIndex = 0;
  let offsetY = 0;

  toasts.forEach((toast, toastIndex) => {
    const isEnding = toast.transitionStatus === 'ending';
    metadata.set(toast.id, {
      value: toast,
      index: toastIndex,
      visibleIndex: isEnding ? -1 : visibleIndex,
      offsetY,
    });

    offsetY += toast.height || 0;

    if (!isEnding) {
      visibleIndex += 1;
    }
  });

  return metadata;
}

// Marks the active (non-ending) toasts beyond `limit` as limited. Callers pass
// toasts in newest-first order, so the newest `limit` toasts stay visible and
// the rest are flagged. Returns the same toast reference when its `limited`
// flag is unchanged to avoid unnecessary re-renders.
function applyLimited(toasts: ToastObject<any>[], limit: number): ToastObject<any>[] {
  let activeIndex = 0;
  return toasts.map((toast) => {
    if (toast.transitionStatus === 'ending') {
      return toast;
    }
    const limited = activeIndex >= limit;
    activeIndex += 1;
    return toast.limited === limited ? toast : { ...toast, limited };
  });
}

const toastMetadataSelector = (state: State) => state.toastMetadata;

export const selectors = {
  toasts: createSelector((state: State) => state.toasts),
  isEmpty: createSelector((state: State) => state.toasts.length === 0),
  toast: createSelector(
    toastMetadataSelector,
    (toastMetadata, id: string) => toastMetadata.get(id)?.value,
  ),
  toastIndex: createSelector(
    toastMetadataSelector,
    (toastMetadata, id: string) => toastMetadata.get(id)?.index ?? -1,
  ),
  toastOffsetY: createSelector(
    toastMetadataSelector,
    (toastMetadata, id: string) => toastMetadata.get(id)?.offsetY ?? 0,
  ),
  toastVisibleIndex: createSelector(
    toastMetadataSelector,
    (toastMetadata, id: string) => toastMetadata.get(id)?.visibleIndex ?? -1,
  ),
  focused: createSelector((state: State) => state.focused),
  viewportOrigin: createSelector((state: State) => state.viewportOrigin),
  expanded: createSelector((state: State) => state.pressed || state.focused),
  expandedOrInactive: createSelector(
    (state: State) => state.pressed || state.focused || !state.isAppActive,
  ),
};

export class ToastStore extends ReactStore<State, {}, typeof selectors> {
  private timers = new Map<string, TimerInfo>();

  private areTimersPaused = false;

  constructor(initialState: InitialState) {
    super(
      { ...initialState, toastMetadata: createToastMetadata(initialState.toasts) },
      {},
      selectors,
    );
  }

  syncProviderProps(timeout: number, limit: number) {
    const limitChanged = this.state.limit !== limit;

    if (this.state.timeout === timeout && !limitChanged) {
      return;
    }

    const updates: Partial<State> = { timeout, limit };

    if (limitChanged) {
      const newToasts = applyLimited(this.state.toasts, limit);
      updates.toasts = newToasts;
      updates.toastMetadata = createToastMetadata(newToasts);
    }

    this.update(updates);
  }

  disposeEffect = () => {
    return () => {
      this.timers.forEach((timer) => {
        timer.timeout?.clear();
      });
      this.timers.clear();
    };
  };

  // An arrow property, unlike upstream's plain method: `useToastManager` hands
  // this straight to the consumer as `remove`, which would lose `this`.
  removeToast = (toastId: string, skipOnRemove: boolean = false) => {
    const index = selectors.toastIndex(this.state, toastId);
    if (index === -1) {
      return;
    }

    const toast = this.state.toasts[index];
    if (!skipOnRemove) {
      toast?.onRemove?.();
    }

    const newToasts = [...this.state.toasts];
    newToasts.splice(index, 1);
    this.setToasts(newToasts);
  };

  addToast = <Data extends object>(toast: ToastManagerAddOptions<Data>): string => {
    const { timeout, limit } = this.state;
    const id = toast.id || generateId('toast');

    if (toast.id) {
      const existingToast = selectors.toast(this.state, toast.id);

      if (existingToast) {
        if (existingToast.transitionStatus === 'ending') {
          this.removeToast(toast.id, true);
        } else {
          const { id: ignoredId, transitionStatus: ignoredTransitionStatus, ...updates } = toast;
          this.updateToastInternal(toast.id, updates, true, true);
          return toast.id;
        }
      }
    }

    const toastToAdd: ToastObject<Data> = {
      ...toast,
      id,
      updateKey: 0,
      transitionStatus: 'starting',
    };

    const updatedToasts = [toastToAdd, ...this.state.toasts];
    this.setToasts(applyLimited(updatedToasts, limit));

    const duration = toastToAdd.timeout ?? timeout;
    if (toastToAdd.type !== 'loading' && duration > 0) {
      this.scheduleTimer(id, duration, () => this.closeToast(id));
    }

    if (selectors.expandedOrInactive(this.state)) {
      this.pauseTimers();
    }

    return id;
  };

  updateToast = <Data extends object>(id: string, updates: ToastManagerUpdateOptions<Data>) => {
    this.updateToastInternal(id, updates, false, true);
  };

  updateToastInternal = <Data extends object>(
    id: string,
    updates: ToastInternalUpdateOptions<Data>,
    resetTimer: boolean = false,
    markUpdated: boolean = false,
  ) => {
    const { timeout, toasts } = this.state;
    const prevToast = selectors.toast(this.state, id);
    if (!prevToast) {
      return;
    }

    // Ignore updates for toasts that are already closing. This prevents races
    // where async updates (e.g. promise success/error) can block a dismissal
    // from completing.
    if (prevToast.transitionStatus === 'ending') {
      return;
    }

    const nextToast: ToastObject<Data> = {
      ...prevToast,
      ...updates,
      ...(markUpdated && { updateKey: (prevToast.updateKey ?? 0) + 1 }),
    };

    this.setToasts(toasts.map((toast) => (toast.id === id ? nextToast : toast)));

    const nextTimeout = nextToast.timeout ?? timeout;
    const prevTimeout = prevToast.timeout ?? timeout;

    const timeoutUpdated = Object.hasOwn(updates, 'timeout');

    const shouldHaveTimer =
      nextToast.transitionStatus !== 'ending' && nextToast.type !== 'loading' && nextTimeout > 0;

    const hasTimer = this.timers.has(id);
    const timeoutChanged = prevTimeout !== nextTimeout;
    const wasLoading = prevToast.type === 'loading';

    if (!shouldHaveTimer && hasTimer) {
      this.clearTimer(id);
      return;
    }

    if (
      shouldHaveTimer &&
      (!hasTimer || timeoutChanged || timeoutUpdated || wasLoading || resetTimer)
    ) {
      this.clearTimer(id);
      this.scheduleTimer(id, nextTimeout, () => this.closeToast(id));

      if (selectors.expandedOrInactive(this.state)) {
        this.pauseTimers();
      }
    }
  };

  closeToast = (toastId?: string) => {
    const closeAll = toastId === undefined;
    const { limit, toasts } = this.state;
    let toastsToClose: ToastObject<any>[];

    if (closeAll) {
      toastsToClose = toasts;
      this.clearTimers();
    } else {
      const toast = selectors.toast(this.state, toastId);
      if (!toast) {
        return;
      }
      toastsToClose = [toast];
      this.clearTimer(toastId);
    }

    const endingToasts = toasts.map((item) =>
      closeAll || item.id === toastId
        ? { ...item, transitionStatus: 'ending' as const, height: 0, measuredHeight: item.height }
        : item,
    );
    const newToasts = applyLimited(endingToasts, limit);
    this.setToasts(newToasts, !newToasts.some((toast) => toast.transitionStatus !== 'ending'));

    toastsToClose.forEach((toast) => {
      if (toast.transitionStatus !== 'ending') {
        toast.onClose?.();
      }
    });
  };

  promiseToast = <Value, Data extends object>(
    promiseValue: Promise<Value>,
    options: ToastManagerPromiseOptions<Value, Data>,
  ): Promise<Value> => {
    // A loading toast does not auto-dismiss.
    const loadingOptions = resolvePromiseOptions(options.loading);
    const id = this.addToast({ ...loadingOptions, type: 'loading' });

    const handledPromise = promiseValue
      .then((result: Value) => {
        const successOptions = resolvePromiseOptions(options.success, result);
        this.updateToast(id, {
          ...successOptions,
          type: 'success',
          timeout: successOptions.timeout,
        });

        return result;
      })
      .catch((error) => {
        const errorOptions = resolvePromiseOptions(options.error, error);
        this.updateToast(id, { ...errorOptions, type: 'error', timeout: errorOptions.timeout });

        return Promise.reject(error);
      });

    // Private API used exclusively by the manager to hand the promise back after
    // it is handled here.
    if (Object.hasOwn(options, 'setPromise')) {
      (options as any).setPromise(handledPromise);
    }

    return handledPromise;
  };

  pauseTimers() {
    if (this.areTimersPaused) {
      return;
    }
    this.areTimersPaused = true;
    this.timers.forEach((timer) => {
      if (timer.timeout) {
        timer.timeout.clear();
        const elapsed = Date.now() - timer.start;
        const remaining = timer.delay - elapsed;
        timer.remaining = remaining > 0 ? remaining : 0;
      }
    });
  }

  resumeTimers() {
    if (!this.areTimersPaused) {
      return;
    }
    this.areTimersPaused = false;
    this.timers.forEach((timer, id) => {
      timer.remaining = timer.remaining > 0 ? timer.remaining : timer.delay;
      timer.timeout ??= Timeout.create();
      timer.timeout.start(timer.remaining, () => {
        this.handleTimerFired(id);
        timer.callback();
      });
      timer.start = Date.now();
    });
  }

  private scheduleTimer(id: string, delay: number, callback: () => void) {
    const start = Date.now();
    const shouldStartActive = !selectors.expandedOrInactive(this.state);
    const currentTimeout = shouldStartActive ? Timeout.create() : undefined;

    currentTimeout?.start(delay, () => {
      this.handleTimerFired(id);
      callback();
    });

    this.timers.set(id, { timeout: currentTimeout, start, delay, remaining: delay, callback });
  }

  private clearTimers() {
    this.timers.forEach((timer) => {
      timer.timeout?.clear();
    });
    this.timers.clear();
    this.areTimersPaused = false;
  }

  private clearTimer(id: string) {
    const timer = this.timers.get(id);
    timer?.timeout?.clear();
    this.timers.delete(id);

    this.resetPausedStateIfNoTimersRemain();
  }

  private handleTimerFired(id: string) {
    this.timers.delete(id);
    this.resetPausedStateIfNoTimersRemain();
  }

  private resetPausedStateIfNoTimersRemain() {
    if (this.timers.size === 0) {
      // No timers remain to keep paused; clear the flag so a fresh toast's
      // running timer can be paused again.
      this.areTimersPaused = false;
    }
  }

  private setToasts(
    newToasts: ToastObject<any>[],
    clearInteraction: boolean = newToasts.length === 0,
  ) {
    const updates: Partial<State> = {
      toasts: newToasts,
      toastMetadata: createToastMetadata(newToasts),
    };
    if (clearInteraction) {
      updates.pressed = false;
      updates.focused = false;
    }
    this.update(updates);
  }
}

interface TimerInfo {
  timeout?: Timeout | undefined;
  start: number;
  delay: number;
  remaining: number;
  callback: () => void;
}
