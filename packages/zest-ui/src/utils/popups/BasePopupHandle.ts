import { AnimationFrame } from '../../hooks/useAnimationFrame';
import { createChangeEventDetails, type ZestChangeEventDetails } from '../createChangeEventDetails';
import { REASONS } from '../reasons';
import type { PopupTriggerMap } from './PopupTriggerMap';

/**
 * The minimal store contract a handle exposes to detached triggers.
 *
 * Detached triggers read `store` during render and subscribe so they are notified
 * when the handle switches between its fallback store and a mounted root's live
 * store.
 */
export interface PopupHandleStoreProvider<HandleStore> {
  readonly store: HandleStore;
  subscribeStore(listener: () => void): () => void;
}

/**
 * The store shape a handle needs to resolve a trigger by id.
 */
export interface PopupHandleStoreWithTriggers {
  readonly context: { readonly triggerNodes: PopupTriggerMap };
}

/**
 * The store shape a handle needs to drive open state. Only the root-owned store
 * needs this — the view exposed to detached triggers never has `setOpen` called
 * on it.
 */
export interface PopupHandleStoreWithOpen extends PopupHandleStoreWithTriggers {
  setOpen(open: boolean, eventDetails: ZestChangeEventDetails<typeof REASONS.imperativeAction>): void;
}

/**
 * The shared implementation behind every popup handle: it coordinates detached
 * triggers with a mounted root.
 *
 * Ported from upstream near-verbatim — it is pure state, and the only DOM in it
 * was the trigger element's type (see `PopupTriggerMap`). Subclasses add the
 * component-specific imperative methods; this owns the fallback store, the root
 * attachment stack, and subscriber notification.
 */
export class BasePopupHandle<
  HandleStore extends PopupHandleStoreWithTriggers,
  Store extends HandleStore & PopupHandleStoreWithOpen,
> {
  /**
   * The stores of every root currently using this handle, in attach order. A
   * handle is meant for a single mounted root, but roots can transiently overlap
   * (an animated screen transition, say), so this stack lets `attachStore`'s
   * cleanup restore the previous root rather than leaving a still-mounted root
   * uncontrollable when a newer one detaches first.
   */
  private readonly attachedStores: Store[] = [];

  private attachedStoreValue: Store | null = null;

  private readonly storeListeners = new Set<() => void>();

  /**
   * @param fallbackStore An inert, closed store handed to detached triggers while
   * no root is attached, so they can render and register without one. Triggers
   * register into whichever store `store` resolves to and migrate themselves as
   * roots attach and detach.
   * @param componentName Prefixes dev warnings, e.g. `'Menu'` produces
   * `MenuHandle.open()`.
   * @param throwOnMissingTrigger Whether `open(triggerId)` throws when no trigger
   * with that id is registered. Anchored popups (Menu, Popover) need a trigger to
   * anchor to, so they throw; a Dialog is not anchored and opens unassociated
   * with a warning instead.
   */
  constructor(
    protected readonly fallbackStore: HandleStore,
    private readonly componentName: string,
    private readonly throwOnMissingTrigger: boolean = true,
  ) {}

  protected get attachedStore() {
    return this.attachedStoreValue;
  }

  /**
   * The store detached triggers read from: the attached root's, or the inert
   * fallback while none is attached.
   * @internal
   */
  get store(): HandleStore {
    return this.attachedStoreValue ?? this.fallbackStore;
  }

  /** @internal */
  subscribeStore(listener: () => void) {
    this.storeListeners.add(listener);

    return () => {
      this.storeListeners.delete(listener);
    };
  }

  /**
   * Points the handle at a root's store and notifies subscribers, so detached
   * triggers re-render and re-register into it. Returns a cleanup that detaches.
   * @internal
   */
  attachStore(newStore: Store) {
    this.attachedStores.push(newStore);
    this.setActiveStore(newStore);

    if (process.env.NODE_ENV !== 'production') {
      if (this.attachedStores.length > 1) {
        // More than one root is attached. This is usually a transient overlap
        // during a screen transition, where the outgoing root unmounts shortly
        // after the incoming one mounts. Defer a frame and only warn if the
        // overlap is still there once things have settled, so a clean handoff
        // stays quiet regardless of unmount timing.
        const dev = this as this & { overlapWarningFrame?: AnimationFrame | undefined };
        (dev.overlapWarningFrame ??= AnimationFrame.create()).request(() => {
          if (this.attachedStores.length > 1) {
            console.warn(
              'Zest: A handle is attached to more than one mounted root at the same time. ' +
                'The most recently mounted root takes over and the previous one stops being controlled by the handle. ' +
                'A handle should be used by a single root that stays mounted for the lifetime of the handle.',
            );
          }
        });
      }
    }

    return () => {
      const index = this.attachedStores.lastIndexOf(newStore);
      if (index !== -1) {
        this.attachedStores.splice(index, 1);
      }
      // Restore control to the most recently attached root that is still
      // mounted, rather than detaching unconditionally.
      this.setActiveStore(this.attachedStores[this.attachedStores.length - 1] ?? null);
    };
  }

  private setActiveStore(store: Store | null) {
    if (this.attachedStoreValue !== store) {
      this.attachedStoreValue = store;
      this.storeListeners.forEach((listener) => {
        listener();
      });
    }
  }

  /**
   * Opens the attached root, associating it with the trigger of the given id.
   * A no-op while no root is attached.
   *
   * Call this from an event handler or an effect, never during rendering.
   */
  protected openByTrigger(triggerId: string | null | undefined) {
    const attachedStore = this.attachedStore;

    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Zest: ${this.componentName}Handle.open() was called while no root using this handle is mounted. ` +
            'The call was ignored; mount a root with this handle before opening it imperatively.',
        );
      }
      return;
    }

    // A trigger normally lives in the active root's store, but during the commit
    // in which a root attaches, a still-mounted detached trigger has not
    // migrated yet — it is registered wherever it lived before. Search the whole
    // stack (newest first) and the fallback, so an imperative open-by-id in that
    // commit still resolves it.
    let triggerNode: unknown;
    if (triggerId) {
      for (let i = this.attachedStores.length - 1; i >= 0 && triggerNode === undefined; i -= 1) {
        triggerNode = this.attachedStores[i]!.context.triggerNodes.getById(triggerId);
      }
      triggerNode ??= this.fallbackStore.context.triggerNodes.getById(triggerId);
    }

    if (triggerId && triggerNode === undefined) {
      if (this.throwOnMissingTrigger) {
        throw new Error(
          `Zest: ${this.componentName}Handle.open() was called with the trigger id "${triggerId}", ` +
            'but no matching trigger is registered with this handle. ' +
            'An anchored popup cannot open without a trigger to anchor to. ' +
            `Pass the id of a mounted ${this.componentName}.Trigger that has this handle set on its "handle" prop.`,
        );
      }

      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Zest: ${this.componentName}Handle.open: No trigger found with id "${triggerId}". ` +
            'The popup will open, but the trigger will not be associated with it.',
        );
      }
    }

    this.associateTrigger(attachedStore, triggerNode);
    attachedStore.setOpen(true, createChangeEventDetails(REASONS.imperativeAction));
  }

  /**
   * Points the popup at the trigger it was opened by. Anchored popups override
   * this to set the store's `triggerNode`, without which their positioner would
   * have nothing to anchor to; an unanchored one (Dialog) has nothing to do.
   */
  protected associateTrigger(_store: Store, _triggerNode: unknown) {}

  /**
   * Closes the popup. A no-op while no root is attached.
   *
   * Call this from an event handler or an effect, never during rendering.
   */
  protected closePopup() {
    const attachedStore = this.attachedStore;

    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Zest: ${this.componentName}Handle.close() was called while no root using this handle is mounted. ` +
            'The call was ignored.',
        );
      }
      return;
    }

    attachedStore.setOpen(false, createChangeEventDetails(REASONS.imperativeAction));
  }
}
