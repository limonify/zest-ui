import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
import { PopupTriggerMap } from '../../utils/popups/PopupTriggerMap';
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
   * The trigger's measured width, the React Native counterpart of the web's
   * `--anchor-width` CSS variable.
   */
  triggerWidth: number | undefined;
  /**
   * The trigger's measured height.
   */
  triggerHeight: number | undefined;
  /**
   * Set by the Positioner so the Trigger can request a reposition when it is
   * laid out. React Native has no `autoUpdate`.
   */
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
  onOpenChange: ((open: boolean, eventDetails: PopoverRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Called once an enter or exit animation has settled, reported by the consumer
   * through `settled(open)`. zest does not animate anything, so it cannot know
   * when an animation ends — the consumer drives it and owns the signal.
   */
  onOpenChangeComplete:
    | ((open: boolean, eventDetails: PopoverRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Every trigger bound to this popup, by id. A handle resolves `open(id)`
   * through this, which is what lets a trigger rendered outside the root open it.
   */
  triggerNodes: PopupTriggerMap;
};

const selectors = {
  open: createSelector((state: State) => state.openProp ?? state.open),
  titleElementId: createSelector((state: State) => state.titleElementId),
  descriptionElementId: createSelector((state: State) => state.descriptionElementId),
  disablePointerDismissal: createSelector((state: State) => state.disablePointerDismissal),
  triggerNode: createSelector((state: State) => state.triggerNode),
  triggerWidth: createSelector((state: State) => state.triggerWidth),
  triggerHeight: createSelector((state: State) => state.triggerHeight),
  update: createSelector((state: State) => state.update),
  payload: createSelector((state: State) => state.payload),
  triggerId: createSelector((state: State) => state.triggerIdProp ?? state.triggerId),
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
        triggerWidth: undefined,
        triggerHeight: undefined,
        update: undefined,
        payload: undefined,
        triggerId: null,
        triggerIdProp: undefined,
        ...initialState,
      },
      { onOpenChange: undefined, onOpenChangeComplete: undefined, triggerNodes: new PopupTriggerMap() },
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

    // Remember the reason so a later `settled(open)` can hand it to
    // `onOpenChangeComplete`.
    this.lastChangeEventDetails = eventDetails;

    this.set('open', nextOpen);
  };

  /**
   * Reports that the enter or exit animation for `open` has settled. zest never
   * animates, so only the consumer knows when their animation finished; calling
   * this fires `onOpenChangeComplete` with the reason of the last committed
   * change. Fire-once per settle: a repeated call with the same value is ignored.
   */
  public settled = (open: boolean) => {
    if (this.lastSettledOpen === open) {
      return;
    }

    this.lastSettledOpen = open;
    // A settle is only meaningful after a committed open/close, which is what
    // records the details; without one there is nothing to complete.
    if (this.lastChangeEventDetails) {
      this.context.onOpenChangeComplete?.(open, this.lastChangeEventDetails);
    }
  };

  /**
   * The event details of the last committed open/close, for `onOpenChangeComplete`.
   */
  private lastChangeEventDetails: PopoverRoot.ChangeEventDetails | undefined;

  /**
   * The last value `settled` fired for, so the same settle is not reported twice.
   */
  private lastSettledOpen: boolean | undefined;
}
