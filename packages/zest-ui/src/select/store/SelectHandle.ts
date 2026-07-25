import { SelectStore } from './SelectStore';
import { BasePopupHandle } from '../../utils/popups/BasePopupHandle';

/**
 * Controls a select imperatively, and associates `Select.Trigger`s rendered
 * outside the root with it. Create one with `Select.createHandle()` and pass it
 * to the root's and the triggers' `handle` prop.
 *
 * The imperative methods only take effect while a root using this handle is
 * mounted; calls made before one attaches (or after it unmounts) are ignored.
 */
// `Payload` is unused in the class body but load-bearing in the public API: a
// `Select.Root`'s `handle?: SelectHandle<Payload>` prop is what infers the
// payload type its `children(payload)` receives.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class SelectHandle<Payload = unknown> extends BasePopupHandle<SelectStore, SelectStore> {
  constructor() {
    // `true`: a select popup is anchored to its trigger, so opening it by an
    // unknown trigger id is an error rather than a warning — there would be
    // nothing to anchor to.
    super(new SelectStore(), 'Select', true);
  }

  /**
   * Points the positioner at the trigger the popup was opened by. Without this
   * an imperative open would anchor to whatever was last pressed.
   */
  protected override associateTrigger(store: SelectStore, triggerNode: unknown) {
    if (triggerNode !== undefined) {
      store.set('triggerNode', triggerNode);
    }
  }

  /**
   * Opens the popup, anchored to the trigger with the given id.
   *
   * Call this from an event handler or an effect, never during rendering.
   *
   * @param triggerId The `nativeID` of a mounted `Select.Trigger` carrying this handle.
   */
  open(triggerId: string) {
    this.openByTrigger(triggerId);
  }

  /**
   * Closes the popup.
   *
   * Call this from an event handler or an effect, never during rendering.
   */
  close() {
    this.closePopup();
  }

  /**
   * Whether the popup is open. `false` while no root is attached.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }
}

/**
 * Creates a handle that connects a `Select.Root` to `Select.Trigger`s rendered
 * outside it, and controls it imperatively.
 */
export function createSelectHandle<Payload = unknown>(): SelectHandle<Payload> {
  return new SelectHandle<Payload>();
}
