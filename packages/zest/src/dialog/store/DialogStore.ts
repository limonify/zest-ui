import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';
import type { ZestChangeEventDetails } from '../../utils/createChangeEventDetails';
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
};

type Context<Reason extends string> = {
  onOpenChange:
    | ((open: boolean, eventDetails: ZestChangeEventDetails<Reason>) => void)
    | undefined;
};

const selectors = {
  open: createSelector((state: State) => state.openProp ?? state.open),
  titleElementId: createSelector((state: State) => state.titleElementId),
  descriptionElementId: createSelector((state: State) => state.descriptionElementId),
  disablePointerDismissal: createSelector((state: State) => state.disablePointerDismissal),
  role: createSelector((state: State) => state.role),
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
 * TODO(later): nested dialog counting, openMethod interaction typing,
 * transitions (`mounted`/`transitionStatus`), handles/payloads.
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
        ...initialState,
      },
      { onOpenChange: undefined },
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

    this.set('open', nextOpen);
  };
}
