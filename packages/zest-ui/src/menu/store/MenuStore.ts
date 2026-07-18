import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
import { PopupTriggerMap } from '../../utils/popups/PopupTriggerMap';
import type { MenuRoot } from '../root/MenuRoot';

export type State = {
  open: boolean;
  openProp: boolean | undefined;
  disablePointerDismissal: boolean;
  /**
   * The anchor's native node, carried across the portal boundary.
   */
  triggerNode: unknown;
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
  disablePointerDismissal: createSelector((state: State) => state.disablePointerDismissal),
  triggerNode: createSelector((state: State) => state.triggerNode),
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
        disablePointerDismissal: false,
        triggerNode: null,
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

    this.context.onOpenChange?.(nextOpen, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    this.set('open', nextOpen);
  };
}
