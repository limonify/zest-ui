import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
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
};

type Context = {
  onOpenChange: ((open: boolean, eventDetails: MenuRoot.ChangeEventDetails) => void) | undefined;
};

const selectors = {
  open: createSelector((state: State) => state.openProp ?? state.open),
  disablePointerDismissal: createSelector((state: State) => state.disablePointerDismissal),
  triggerNode: createSelector((state: State) => state.triggerNode),
  update: createSelector((state: State) => state.update),
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
        ...initialState,
      },
      { onOpenChange: undefined },
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
