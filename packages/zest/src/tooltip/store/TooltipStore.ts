import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
import type { TooltipRoot } from '../root/TooltipRoot';

export type State = {
  open: boolean;
  openProp: boolean | undefined;
  /**
   * The anchor's native node, carried across the portal boundary.
   */
  triggerNode: unknown;
  update: (() => void) | undefined;
};

type Context = {
  onOpenChange: ((open: boolean, eventDetails: TooltipRoot.ChangeEventDetails) => void) | undefined;
};

const selectors = {
  open: createSelector((state: State) => state.openProp ?? state.open),
  triggerNode: createSelector((state: State) => state.triggerNode),
  update: createSelector((state: State) => state.update),
};

export class TooltipStore extends ReactStore<Readonly<State>, Context, typeof selectors> {
  constructor(initialState?: Partial<State>) {
    super(
      { open: false, openProp: undefined, triggerNode: null, update: undefined, ...initialState },
      { onOpenChange: undefined },
      selectors,
    );
  }

  public setOpen = (nextOpen: boolean, eventDetails: TooltipRoot.ChangeEventDetails) => {
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
