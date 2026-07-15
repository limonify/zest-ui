import { DialogStore } from './DialogStore';
import { createChangeEventDetails } from '../../utils/createChangeEventDetails';
import { REASONS } from '../../utils/reasons';
import { BasePopupHandle } from '../../utils/popups/BasePopupHandle';

/**
 * Controls a dialog imperatively, and associates `Dialog.Trigger`s rendered
 * outside the root with it. Create one with `Dialog.createHandle()` and pass it
 * to the root's and the triggers' `handle` prop.
 *
 * The imperative methods only take effect while a root using this handle is
 * mounted; calls made before one attaches (or after it unmounts) are ignored.
 */
export class DialogHandle<Payload = unknown> extends BasePopupHandle<
  DialogStore<any>,
  DialogStore<any>
> {
  constructor(componentName: string = 'Dialog') {
    // An inert, closed store for detached triggers to register into while no root
    // is mounted. `false`: a dialog is not anchored, so opening it by an unknown
    // trigger id is a warning rather than an error.
    super(new DialogStore(), componentName, false);
  }

  /**
   * Opens the dialog, optionally associating it with a trigger.
   *
   * Call this from an event handler or an effect, never during rendering.
   *
   * @param triggerId The id of a mounted `Dialog.Trigger` carrying this handle,
   * or `null` to open without associating one.
   */
  open(triggerId: string | null = null) {
    this.openByTrigger(triggerId);
  }

  /**
   * Opens the dialog with a payload, without associating it with a trigger. The
   * payload reaches the root's children when they are a function.
   *
   * Call this from an event handler or an effect, never during rendering.
   */
  openWithPayload(payload: Payload) {
    const attachedStore = this.attachedStore;

    if (attachedStore === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Zest: DialogHandle.openWithPayload() was called while no root using this handle is mounted. ' +
            'The call and its payload were ignored; mount a root with this handle before opening it imperatively.',
        );
      }
      return;
    }

    attachedStore.set('payload', payload);
    attachedStore.setOpen(true, createChangeEventDetails(REASONS.imperativeAction));
  }

  /**
   * Closes the dialog.
   *
   * Call this from an event handler or an effect, never during rendering.
   */
  close() {
    this.closePopup();
  }

  /**
   * Whether the dialog is open. `false` while no root is attached.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }
}

/**
 * Creates a handle that connects a `Dialog.Root` to `Dialog.Trigger`s rendered
 * outside it, and controls it imperatively.
 */
export function createDialogHandle<Payload = unknown>(): DialogHandle<Payload> {
  return new DialogHandle<Payload>();
}
