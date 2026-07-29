import { createSelector } from './createSelector';

type State = { a: number; b: number; c: number; d: number; e: number };

const state: State = { a: 1, b: 2, c: 3, d: 4, e: 5 };

describe('createSelector', () => {
  it('returns the selector unchanged when given one function', () => {
    const selector = createSelector((s: State) => s.a);

    expect(selector(state)).toBe(1);
  });

  it('combines two functions', () => {
    const selector = createSelector(
      (s: State) => s.a,
      (a: number) => a * 10,
    );

    expect(selector(state)).toBe(10);
  });

  it('combines three functions', () => {
    const selector = createSelector(
      (s: State) => s.a,
      (s: State) => s.b,
      (a: number, b: number) => a + b,
    );

    expect(selector(state)).toBe(3);
  });

  it('combines four functions', () => {
    const selector = createSelector(
      (s: State) => s.a,
      (s: State) => s.b,
      (s: State) => s.c,
      (a: number, b: number, c: number) => a + b + c,
    );

    expect(selector(state)).toBe(6);
  });

  it('combines five functions', () => {
    const selector = createSelector(
      (s: State) => s.a,
      (s: State) => s.b,
      (s: State) => s.c,
      (s: State) => s.d,
      (a: number, b: number, c: number, d: number) => a + b + c + d,
    );

    expect(selector(state)).toBe(10);
  });

  it('combines six functions', () => {
    const selector = createSelector(
      (s: State) => s.a,
      (s: State) => s.b,
      (s: State) => s.c,
      (s: State) => s.d,
      (s: State) => s.e,
      (a: number, b: number, c: number, d: number, e: number) => a + b + c + d + e,
    );

    expect(selector(state)).toBe(15);
  });

  // Extra arguments are threaded to every selector and then to the combiner,
  // which is how parameterised selectors (e.g. "is item N selected") work.
  it('passes extra arguments through to the selectors and the combiner', () => {
    const selector = createSelector(
      (s: State, multiplier: number) => s.a * multiplier,
      (a: number, multiplier: number) => a + multiplier,
    );

    expect(selector(state, 3)).toBe(6);
  });

  it('throws when given more than six functions', () => {
    const fn = (s: State) => s.a;

    expect(() => (createSelector as any)(fn, fn, fn, fn, fn, fn, fn)).toThrow(
      'Unsupported number of selectors',
    );
  });

  it('throws when given nothing', () => {
    expect(() => (createSelector as any)()).toThrow('Missing arguments');
  });
});
