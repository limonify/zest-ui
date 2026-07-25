import { ComboboxStore } from './ComboboxStore';
import { BasePopupHandle } from '../../utils/popups/BasePopupHandle';

/**
 * Controls a combobox imperatively, and associates a `Combobox.Input` rendered
 * outside the root with it. Create one with `Combobox.createHandle()` and pass
 * it to the root's and the input's `handle` prop.
 *
 * The imperative methods only take effect while a root using this handle is
 * mounted; calls made before one attaches (or after it unmounts) are ignored.
 */
export class ComboboxHandle extends BasePopupHandle<ComboboxStore, ComboboxStore> {
  constructor(componentName: string = 'Combobox') {
    // `true`: the list is anchored to the input, so opening it by an unknown
    // trigger id is an error rather than a warning — there would be nothing to
    // anchor to.
    super(new ComboboxStore(), componentName, true);
  }

  /**
   * Points the positioner at the input the list was opened from. Without this an
   * imperative open would anchor to whatever was last measured.
   */
  protected override associateTrigger(store: ComboboxStore, triggerNode: unknown) {
    if (triggerNode !== undefined) {
      store.set('triggerNode', triggerNode);
    }
  }

  /**
   * Opens the list, anchored to the input with the given id.
   *
   * Call this from an event handler or an effect, never during rendering.
   *
   * @param triggerId The `nativeID` of a mounted `Combobox.Input` carrying this handle.
   */
  open(triggerId: string) {
    this.openByTrigger(triggerId);
  }

  /**
   * Closes the list.
   *
   * Call this from an event handler or an effect, never during rendering.
   */
  close() {
    this.closePopup();
  }

  /**
   * Whether the list is open. `false` while no root is attached.
   */
  get isOpen() {
    return this.attachedStore?.select('open') ?? false;
  }
}

/**
 * Creates a handle that connects a `Combobox.Root` to a `Combobox.Input`
 * rendered outside it, and controls it imperatively.
 */
export function createComboboxHandle(): ComboboxHandle {
  return new ComboboxHandle();
}
