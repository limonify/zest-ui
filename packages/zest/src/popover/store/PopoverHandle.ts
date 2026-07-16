import { PopoverStore } from './PopoverStore';
import { BasePopupHandle } from '../../utils/popups/BasePopupHandle';

/**
 * Controls a popover imperatively, and associates `Popover.Trigger`s rendered outside
 * the root with it. Create one with `Popover.createHandle()` and pass it to the
 * root's and the triggers' `handle` prop.
 *
 * The imperative methods only take effect while a root using this handle is
 * mounted; calls made before one attaches (or after it unmounts) are ignored.
 */
// `Payload` is unused in the class body but load-bearing in the public API: a
// `Popover.Root`'s `handle?: PopoverHandle<Payload>` prop is what infers the
// payload type its `children(payload)` receives.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class PopoverHandle<Payload = unknown> extends BasePopupHandle<PopoverStore, PopoverStore> {
  constructor() {
    // `true`: a popover is anchored, so opening it by an unknown trigger id is an
    // error rather than a warning — there would be nothing to anchor to.
    super(new PopoverStore(), 'Popover', true);
  }

  /**
   * Points the positioner at the trigger the popover was opened by. Without this an
   * imperative open would anchor to whatever was last pressed.
   */
  protected override associateTrigger(store: PopoverStore, triggerNode: unknown) {
    if (triggerNode !== undefined) {
      store.set('triggerNode', triggerNode);
    }
  }

  /**
   * Opens the popover, anchored to the trigger with the given id.
   *
   * Call this from an event handler or an effect, never during rendering.
   *
   * @param triggerId The `nativeID` of a mounted `Popover.Trigger` carrying this handle.
   */
  open(triggerId: string) {
    this.openByTrigger(triggerId);
  }

  /**
   * Closes the popover.
   *
   * Call this from an event handler or an effect, never during rendering.
   */
  close() {
    this.closePopup();
  }

  /**
   * Whether the popover is open. `false` while no root is attached.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }
}

/**
 * Creates a handle that connects a `Popover.Root` to `Popover.Trigger`s rendered
 * outside it, and controls it imperatively.
 */
export function createPopoverHandle<Payload = unknown>(): PopoverHandle<Payload> {
  return new PopoverHandle<Payload>();
}
