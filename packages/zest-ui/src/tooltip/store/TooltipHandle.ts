import { TooltipStore } from './TooltipStore';
import { BasePopupHandle } from '../../utils/popups/BasePopupHandle';

/**
 * Controls a tooltip imperatively, and associates `Tooltip.Trigger`s rendered
 * outside the root with it. Create one with `Tooltip.createHandle()` and pass it
 * to the root's and the triggers' `handle` prop.
 *
 * The imperative methods only take effect while a root using this handle is
 * mounted; calls made before one attaches (or after it unmounts) are ignored.
 */
// `Payload` is unused in the class body but load-bearing in the public API: a
// `Tooltip.Root`'s `handle?: TooltipHandle<Payload>` prop is what infers the
// payload type its `children(payload)` receives.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class TooltipHandle<Payload = unknown> extends BasePopupHandle<TooltipStore, TooltipStore> {
  constructor() {
    // `true`: a tooltip is anchored, so opening it by an unknown trigger id is an
    // error rather than a warning — there would be nothing to anchor to.
    super(new TooltipStore(), 'Tooltip', true);
  }

  /**
   * Points the positioner at the trigger the tooltip was opened by. Without this
   * an imperative open would anchor to whatever was last pressed.
   */
  protected override associateTrigger(store: TooltipStore, triggerNode: unknown) {
    if (triggerNode !== undefined) {
      store.set('triggerNode', triggerNode);
    }
  }

  /**
   * Opens the tooltip, anchored to the trigger with the given id.
   *
   * Call this from an event handler or an effect, never during rendering.
   *
   * @param triggerId The `nativeID` of a mounted `Tooltip.Trigger` carrying this handle.
   */
  open(triggerId: string) {
    this.openByTrigger(triggerId);
  }

  /**
   * Closes the tooltip.
   *
   * Call this from an event handler or an effect, never during rendering.
   */
  close() {
    this.closePopup();
  }

  /**
   * Whether the tooltip is open. `false` while no root is attached.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }
}

/**
 * Creates a handle that connects a `Tooltip.Root` to `Tooltip.Trigger`s rendered
 * outside it, and controls it imperatively.
 */
export function createTooltipHandle<Payload = unknown>(): TooltipHandle<Payload> {
  return new TooltipHandle<Payload>();
}
