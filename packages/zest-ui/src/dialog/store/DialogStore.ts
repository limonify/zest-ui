import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
import { PopupTriggerMap } from '../../utils/popups/PopupTriggerMap';
import type { DialogRootChangeEventReason } from '../root/DialogRoot';

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
   * `alertdialog` for AlertDialog, which reuses this store and every Dialog part.
   */
  role: 'dialog' | 'alertdialog';
  /**
   * The payload of the trigger the dialog was opened by, handed to the root's
   * children when they are a function.
   */
  payload: unknown;
  /**
   * The id of the trigger the dialog is associated with, or `null` for none.
   */
  triggerId: string | null;
  /**
   * The controlled `triggerId` prop, when provided.
   */
  triggerIdProp: string | null | undefined;
  /**
   * Whether this dialog is itself rendered inside another dialog's tree.
   */
  nested: boolean;
  /**
   * How many dialogs nested inside this one are currently open. A count rather
   * than a flag because siblings can overlap while one animates out.
   */
  nestedOpenCount: number;
};

type Context<Reason extends string> = {
  onOpenChange:
    | ((open: boolean, eventDetails: ZestChangeEventDetails<Reason>) => void)
    | undefined;
  /**
   * Called once an enter or exit animation has settled, reported by the consumer
   * through `settled(open)`. zest does not animate anything, so it cannot know
   * when an animation ends — the consumer drives it and owns the signal.
   */
  onOpenChangeComplete:
    | ((open: boolean, eventDetails: ZestChangeEventDetails<Reason>) => void)
    | undefined;
  /**
   * Every trigger bound to this dialog, by id. A handle resolves `open(id)`
   * through this, which is what lets a trigger rendered outside the root open it.
   */
  triggerNodes: PopupTriggerMap;
};

const selectors = {
  open: createSelector((state: State) => state.openProp ?? state.open),
  titleElementId: createSelector((state: State) => state.titleElementId),
  payload: createSelector((state: State) => state.payload),
  triggerId: createSelector((state: State) => state.triggerIdProp ?? state.triggerId),
  descriptionElementId: createSelector((state: State) => state.descriptionElementId),
  disablePointerDismissal: createSelector((state: State) => state.disablePointerDismissal),
  role: createSelector((state: State) => state.role),
  nested: createSelector((state: State) => state.nested),
  nestedDialogOpen: createSelector((state: State) => state.nestedOpenCount > 0),
};

/**
 * React Native adaptation of Base UI's DialogStore.
 *
 * `Dialog`, `AlertDialog` and `Drawer` all share this store but do not dismiss
 * for the same set of reasons — only a drawer can be swiped away. The store is
 * generic over that union so no variant advertises a reason it cannot emit, and
 * `DialogRootContext` erases it to `any` (the same trick the group components
 * use) so the parts stay non-generic.
 *
 * TODO(later): openMethod interaction typing.
 */
export class DialogStore<Reason extends string = DialogRootChangeEventReason> extends ReactStore<
  Readonly<State>,
  Context<Reason>,
  typeof selectors
> {
  constructor(initialState?: Partial<State>) {
    super(
      {
        open: false,
        openProp: undefined,
        titleElementId: undefined,
        descriptionElementId: undefined,
        disablePointerDismissal: false,
        role: 'dialog',
        payload: undefined,
        triggerId: null,
        triggerIdProp: undefined,
        nested: false,
        nestedOpenCount: 0,
        ...initialState,
      },
      { onOpenChange: undefined, onOpenChangeComplete: undefined, triggerNodes: new PopupTriggerMap() },
      selectors,
    );
  }

  public setOpen = (nextOpen: boolean, eventDetails: ZestChangeEventDetails<Reason>) => {
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
  private lastChangeEventDetails: ZestChangeEventDetails<Reason> | undefined;

  /**
   * The last value `settled` fired for, so the same settle is not reported twice.
   */
  private lastSettledOpen: boolean | undefined;

  /**
   * Records that a dialog nested inside this one opened or closed.
   *
   * Increments rather than assigns, so two descendants closing out of order
   * cannot leave the count stuck above zero.
   */
  public setNestedOpen = (open: boolean) => {
    this.set('nestedOpenCount', Math.max(0, this.state.nestedOpenCount + (open ? 1 : -1)));
  };
}
