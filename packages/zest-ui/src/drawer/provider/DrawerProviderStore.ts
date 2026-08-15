import { createSelector } from '../../store/createSelector';
import { ReactStore } from '../../store/ReactStore';

export type State = {
  /**
   * Every open drawer, by identity. A Set rather than a count so a drawer that
   * registers twice, or unmounts while open, cannot leave the tally wrong.
   */
  openDrawers: ReadonlySet<object>;
  /**
   * How far the frontmost drawer has been swiped towards dismissal, `0` to `1`.
   */
  swipeProgress: number;
  /**
   * The measured height of the frontmost drawer's popup.
   */
  frontmostHeight: number;
};

const selectors = {
  active: createSelector((state: State) => state.openDrawers.size > 0),
  swipeProgress: createSelector((state: State) => state.swipeProgress),
  frontmostHeight: createSelector((state: State) => state.frontmostHeight),
};

/**
 * Tracks whether any drawer under a `Drawer.Provider` is open, and how far the
 * frontmost one has been swiped.
 *
 * A store rather than React state so the per-frame `swipeProgress` never forces
 * a React render: `Drawer.Indent`/`IndentBackground` read it as a snapshot (they
 * re-render only for the discrete `active` flip), and a consumer who wants the
 * scale to follow the finger subscribes non-reactively and mirrors it into their
 * own animation library's shared value.
 */
export class DrawerProviderStore extends ReactStore<Readonly<State>, {}, typeof selectors> {
  constructor(initialState?: Partial<State>) {
    super(
      {
        openDrawers: new Set<object>(),
        swipeProgress: 0,
        frontmostHeight: 0,
        ...initialState,
      },
      {},
      selectors,
    );
  }

  public setDrawerOpen = (drawer: object, open: boolean) => {
    const current = this.state.openDrawers;
    if (current.has(drawer) === open) {
      return;
    }

    const next = new Set(current);
    if (open) {
      next.add(drawer);
    } else {
      next.delete(drawer);
    }

    this.set('openDrawers', next);

    // Nothing is in front any more, so nothing is being swiped.
    if (next.size === 0) {
      this.set('swipeProgress', 0);
      this.set('frontmostHeight', 0);
    }
  };

  public setVisualState = (swipeProgress: number, frontmostHeight: number) => {
    if (this.state.swipeProgress !== swipeProgress) {
      this.set('swipeProgress', swipeProgress);
    }
    if (this.state.frontmostHeight !== frontmostHeight) {
      this.set('frontmostHeight', frontmostHeight);
    }
  };
}
