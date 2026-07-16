import { MenuStore } from './MenuStore';
import { BasePopupHandle } from '../../utils/popups/BasePopupHandle';

/**
 * Controls a menu imperatively, and associates `Menu.Trigger`s rendered outside
 * the root with it. Create one with `Menu.createHandle()` and pass it to the
 * root's and the triggers' `handle` prop.
 *
 * The imperative methods only take effect while a root using this handle is
 * mounted; calls made before one attaches (or after it unmounts) are ignored.
 */
// `Payload` is unused in the class body but load-bearing in the public API: a
// `Menu.Root`'s `handle?: MenuHandle<Payload>` prop is what infers the payload
// type its `children(payload)` receives.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class MenuHandle<Payload = unknown> extends BasePopupHandle<MenuStore, MenuStore> {
  constructor() {
    // `true`: a menu is anchored, so opening it by an unknown trigger id is an
    // error rather than a warning — there would be nothing to anchor to.
    super(new MenuStore(), 'Menu', true);
  }

  /**
   * Points the positioner at the trigger the menu was opened by. Without this an
   * imperative open would anchor to whatever was last pressed.
   */
  protected override associateTrigger(store: MenuStore, triggerNode: unknown) {
    if (triggerNode !== undefined) {
      store.set('triggerNode', triggerNode);
    }
  }

  /**
   * Opens the menu, anchored to the trigger with the given id.
   *
   * Call this from an event handler or an effect, never during rendering.
   *
   * @param triggerId The `nativeID` of a mounted `Menu.Trigger` carrying this handle.
   */
  open(triggerId: string) {
    this.openByTrigger(triggerId);
  }

  /**
   * Closes the menu.
   *
   * Call this from an event handler or an effect, never during rendering.
   */
  close() {
    this.closePopup();
  }

  /**
   * Whether the menu is open. `false` while no root is attached.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }
}

/**
 * Creates a handle that connects a `Menu.Root` to `Menu.Trigger`s rendered
 * outside it, and controls it imperatively.
 */
export function createMenuHandle<Payload = unknown>(): MenuHandle<Payload> {
  return new MenuHandle<Payload>();
}
