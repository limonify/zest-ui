'use client';
import { useRefWithInit } from './useRefWithInit';
import { useOnMount } from './useOnMount';

type AnimationFrameId = number;

/* Unlike `setTimeout`, rAF doesn't guarantee a positive integer return value, so we can't have
 * a monomorphic `uint` type with `0` meaning empty. */
const EMPTY = null;

let LAST_RAF = globalThis.requestAnimationFrame;

class Scheduler {
  /* This implementation uses an array as a backing data-structure for frame callbacks.
   * It allows `O(1)` callback cancelling by inserting a `null` in the array, though it
   * never calls the native `cancelAnimationFrame` if there are no frames left. */

  callbacks = [] as (FrameRequestCallback | null)[];

  callbacksCount = 0;

  nextId = 1;

  startId = 1;

  isScheduled = false;

  /* The handle of the frame `tick` is scheduled on. Kept only so
   * `resetAnimationFrameScheduler` can cancel it; the hot path never does. */
  scheduledFrameId: AnimationFrameId | null = EMPTY;

  tick = (timestamp: number) => {
    this.isScheduled = false;
    this.scheduledFrameId = EMPTY;

    const currentCallbacks = this.callbacks;
    const currentCallbacksCount = this.callbacksCount;

    // Update these before iterating, callbacks could call `requestAnimationFrame` again.
    this.callbacks = [];
    this.callbacksCount = 0;
    this.startId = this.nextId;

    if (currentCallbacksCount > 0) {
      for (let i = 0; i < currentCallbacks.length; i += 1) {
        currentCallbacks[i]?.(timestamp);
      }
    }
  };

  request(fn: FrameRequestCallback) {
    const id = this.nextId;
    this.nextId += 1;
    this.callbacks.push(fn);
    this.callbacksCount += 1;

    /* In a test environment with fake timers, a fake `requestAnimationFrame` can be called
     * but there's no guarantee that the animation frame will actually run before the fake
     * timers are teared, which leaves `isScheduled` set, but won't run our `tick()`. */
    const didRAFChange =
      process.env.NODE_ENV !== 'production' &&
      LAST_RAF !== requestAnimationFrame &&
      ((LAST_RAF = requestAnimationFrame), true);

    if (!this.isScheduled || didRAFChange) {
      this.scheduledFrameId = requestAnimationFrame(this.tick);
      this.isScheduled = true;
    }
    return id;
  }

  cancel(id: AnimationFrameId) {
    const index = id - this.startId;
    if (index < 0 || index >= this.callbacks.length) {
      return;
    }
    this.callbacks[index] = null;
    this.callbacksCount -= 1;
  }
}

let scheduler = new Scheduler();

/**
 * Replaces the shared scheduler and drops all pending animation frame callbacks.
 *
 * For test environments only. The scheduler is process-global, so a callback scheduled in one test
 * but never run would otherwise survive into a later test and run there against stale state.
 */
export function resetAnimationFrameScheduler() {
  const previous = scheduler;
  scheduler = new Scheduler();
  scheduler.nextId = previous.nextId;
  scheduler.startId = previous.nextId;
  previous.callbacks = [];
  previous.callbacksCount = 0;

  /* Dropping the callbacks is not enough: the frame `tick` is scheduled on is still pending, and
   * jest-expo implements `requestAnimationFrame` as a `setTimeout` that reads the (by then torn
   * down) Jest environment. Leaving it queued surfaces as a "you are trying to access ... after it
   * has been torn down" error attributed to whichever test file scheduled it. */
  if (previous.scheduledFrameId !== EMPTY) {
    cancelAnimationFrame(previous.scheduledFrameId);
    previous.scheduledFrameId = EMPTY;
    previous.isScheduled = false;
  }
}

export class AnimationFrame {
  static create() {
    return new AnimationFrame();
  }

  static request(fn: FrameRequestCallback) {
    return scheduler.request(fn);
  }

  static cancel(id: AnimationFrameId) {
    return scheduler.cancel(id);
  }

  currentId: AnimationFrameId | null = EMPTY;

  /**
   * Executes `fn` on the next frame, clearing any previously scheduled call.
   */
  request(fn: Function) {
    this.cancel();
    this.currentId = scheduler.request(() => {
      this.currentId = EMPTY;
      fn();
    });
  }

  cancel = () => {
    if (this.currentId !== EMPTY) {
      scheduler.cancel(this.currentId);
      this.currentId = EMPTY;
    }
  };

  disposeEffect = () => {
    return this.cancel;
  };
}

/**
 * A `requestAnimationFrame` with automatic cleanup and guard.
 */
export function useAnimationFrame() {
  const timeout = useRefWithInit(AnimationFrame.create).current;

  useOnMount(timeout.disposeEffect);

  return timeout;
}
