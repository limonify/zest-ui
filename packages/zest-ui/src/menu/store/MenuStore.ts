import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
import { PopupTriggerMap } from '../../utils/popups/PopupTriggerMap';
import type { MenuRoot } from '../root/MenuRoot';

export type State = {
  open: boolean;
  openProp: boolean | undefined;
  /**
   * Whether the menu should ignore user interaction entirely.
   */
  disabled: boolean;
  disablePointerDismissal: boolean;
  /**
   * The anchor's native node, carried across the portal boundary.
   */
  triggerNode: unknown;
  /**
   * The trigger's measured width, the React Native counterpart of the web's
   * `--anchor-width` CSS variable.
   */
  triggerWidth: number | undefined;
  /**
   * The trigger's measured height.
   */
  triggerHeight: number | undefined;
  update: (() => void) | undefined;
  /**
   * The payload of the trigger the popup was opened by, handed to the root's
   * children when they are a function.
   */
  payload: unknown;
  /**
   * The id of the trigger the popup is associated with, or `null` for none.
   */
  triggerId: string | null;
  /**
   * The controlled `triggerId` prop, when provided.
   */
  triggerIdProp: string | null | undefined;
};

type Context = {
  onOpenChange: ((open: boolean, eventDetails: MenuRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Every trigger bound to this popup, by id. A handle resolves `open(id)`
   * through this, which is what lets a trigger rendered outside the root open it.
   */
  triggerNodes: PopupTriggerMap;
};

const selectors = {
  open: createSelector((state: State) => state.openProp ?? state.open),
  disabled: createSelector((state: State) => state.disabled),
  disablePointerDismissal: createSelector((state: State) => state.disablePointerDismissal),
  triggerNode: createSelector((state: State) => state.triggerNode),
  triggerWidth: createSelector((state: State) => state.triggerWidth),
  triggerHeight: createSelector((state: State) => state.triggerHeight),
  update: createSelector((state: State) => state.update),
  payload: createSelector((state: State) => state.payload),
  triggerId: createSelector((state: State) => state.triggerIdProp ?? state.triggerId),
};

export class MenuStore extends ReactStore<Readonly<State>, Context, typeof selectors> {
  constructor(initialState?: Partial<State>) {
    super(
      {
        open: false,
        openProp: undefined,
        disabled: false,
        disablePointerDismissal: false,
        triggerNode: null,
        triggerWidth: undefined,
        triggerHeight: undefined,
        update: undefined,
        payload: undefined,
        triggerId: null,
        triggerIdProp: undefined,
        ...initialState,
      },
      { onOpenChange: undefined, triggerNodes: new PopupTriggerMap() },
      selectors,
    );
  }

  public setOpen = (nextOpen: boolean, eventDetails: MenuRoot.ChangeEventDetails) => {
    if (nextOpen === this.select('open')) {
      return;
    }

    // A disabled menu cannot be opened, by a press or by a handle. Closing it is
    // always allowed, so disabling one that is already open puts it away.
    if (nextOpen && this.select('disabled')) {
      return;
    }

    this.context.onOpenChange?.(nextOpen, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.set('open', nextOpen);
  };
}
