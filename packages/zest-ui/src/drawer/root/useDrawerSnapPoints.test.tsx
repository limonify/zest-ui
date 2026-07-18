import {
  closestSnapPointIndex,
  getSnapPointSwipeMovement,
  resolveSnapPointHeight,
  resolveSnapPoints,
} from './useDrawerSnapPoints';

const VIEWPORT = 800;
const POPUP = 600;

describe('resolveSnapPointHeight', () => {
  it('reads a number <= 1 as a fraction of the viewport', () => {
    expect(resolveSnapPointHeight(0.5, VIEWPORT)).toBe(400);
    expect(resolveSnapPointHeight(1, VIEWPORT)).toBe(800);
  });

  it('reads a number > 1 as pixels', () => {
    expect(resolveSnapPointHeight(148, VIEWPORT)).toBe(148);
  });

  it('clamps a negative fraction to zero', () => {
    expect(resolveSnapPointHeight(-0.5, VIEWPORT)).toBe(0);
  });

  it('rejects a non-finite snap point or viewport', () => {
    expect(resolveSnapPointHeight(Number.NaN, VIEWPORT)).toBeNull();
    expect(resolveSnapPointHeight(0.5, 0)).toBeNull();
  });
});

describe('resolveSnapPoints', () => {
  it('turns each snap point into a visible height and a matching offset', () => {
    expect(resolveSnapPoints([0.25, 0.5], POPUP, VIEWPORT)).toEqual([
      { value: 0.25, height: 200, offset: 400 },
      { value: 0.5, height: 400, offset: 200 },
    ]);
  });

  it('caps a height at the popup, so a fully open drawer has no offset', () => {
    // 1 * 800 = 800, but the popup is only 600 tall.
    expect(resolveSnapPoints([1], POPUP, VIEWPORT)).toEqual([
      { value: 1, height: POPUP, offset: 0 },
    ]);
  });

  it('is empty until the popup has been measured', () => {
    expect(resolveSnapPoints([0.5], 0, VIEWPORT)).toEqual([]);
  });

  it('is empty without snap points', () => {
    expect(resolveSnapPoints(undefined, POPUP, VIEWPORT)).toEqual([]);
    expect(resolveSnapPoints([], POPUP, VIEWPORT)).toEqual([]);
  });

  it('drops snap points that resolve within a pixel of each other', () => {
    // 0.25 * 800 = 200, and 200px is the same place.
    const resolved = resolveSnapPoints([0.25, 200, 0.5], POPUP, VIEWPORT);

    expect(resolved.map((point) => point.value)).toEqual([200, 0.5]);
  });

  it('drops a snap point that cannot be resolved', () => {
    expect(resolveSnapPoints([Number.NaN, 0.5], POPUP, VIEWPORT).map((p) => p.value)).toEqual([0.5]);
  });
});

describe('closestSnapPointIndex', () => {
  it('finds the nearest value', () => {
    expect(closestSnapPointIndex([0, 200, 400], 190)).toBe(1);
    expect(closestSnapPointIndex([0, 200, 400], 320)).toBe(2);
  });

  it('is -1 when there are none', () => {
    expect(closestSnapPointIndex([], 100)).toBe(-1);
  });
});

describe('getSnapPointSwipeMovement', () => {
  it('passes movement through while the drawer stays on screen', () => {
    expect(getSnapPointSwipeMovement(200, 50)).toBe(50);
    expect(getSnapPointSwipeMovement(200, -200)).toBe(-200);
  });

  it('damps movement that overshoots the fully-open edge', () => {
    // Would land at -100; instead it resists.
    const movement = getSnapPointSwipeMovement(200, -300);

    expect(movement).toBeGreaterThan(-300);
    expect(movement).toBe(-Math.sqrt(100) - 200);
  });
});
