import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
import type { PopoverRoot } from '../root/PopoverRoot';

export type State = {
  /**
   * The uncontrolled open state. Consumers must read through the `open`
   * selector, which resolves the controlled prop first.
   */
  open: boolean;
  /**
   * The controlled `open` prop, when provided. Takes precedence over the
   * internal `open` state (mirrors Base UI's popup store).
   */
  openProp: boolean | undefined;
  titleElementId: string | undefined;
  descriptionElementId: string | undefined;
  disablePointerDismissal: boolean;
  /**
   * The anchor's native node. The Positioner lives inside the portal, in a
   * different subtree from the Trigger, so the store is what carries it across.
   */
  triggerNode: unknown;
  /**
   * Set by the Positioner so the Trigger can request a reposition when it is
   * laid out. React Native has no `autoUpdate`.
   */
  update: (() => void) | undefined;
};

type Context = {
  onOpenChange: ((open: boolean, eventDetails: PopoverRoot.ChangeEventDetails) => void) | undefined;
};

const selectors = {
  open: createSelector((state: State) => state.openProp ?? state.open),
  titleElementId: createSelector((state: State) => state.titleElementId),
  descriptionElementId: createSelector((state: State) => state.descriptionElementId),
  disablePointerDismissal: createSelector((state: State) => state.disablePointerDismissal),
  triggerNode: createSelector((state: State) => state.triggerNode),
  update: createSelector((state: State) => state.update),
};

/**
 * React Native adaptation of Base UI's PopoverStore.
 */
export class PopoverStore extends ReactStore<Readonly<State>, Context, typeof selectors> {
  constructor(initialState?: Partial<State>) {
    super(
      {
        open: false,
        openProp: undefined,
        titleElementId: undefined,
        descriptionElementId: undefined,
        disablePointerDismissal: false,
        triggerNode: null,
        update: undefined,
        ...initialState,
      },
      { onOpenChange: undefined },
      selectors,
    );
  }

  public setOpen = (nextOpen: boolean, eventDetails: PopoverRoot.ChangeEventDetails) => {
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
