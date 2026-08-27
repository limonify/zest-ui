import {
  clampValue,
  countStepDecimals,
  roundValueToStep,
  sliderPercentFromValue,
  sliderValueFromPosition,
  type SliderValueGeometry,
} from './sliderValue';

// These are the arithmetic `SliderRoot` runs, extracted so a consumer animating
// the thumb on the UI thread converts a touch the same way the store does. They
// are tested here rather than only through the Root because a worklet caller
// reaches them directly — and because a drift between the two copies is exactly
// what having one copy is meant to prevent.

const geometry = (over: Partial<SliderValueGeometry> = {}): SliderValueGeometry => ({
  controlSize: 200,
  orientation: 'horizontal',
  direction: 'ltr',
  min: 0,
  max: 100,
  step: 1,
  ...over,
});

describe('clampValue', () => {
  it('holds a value inside its bounds', () => {
    expect(clampValue(5, 0, 10)).toBe(5);
    expect(clampValue(-1, 0, 10)).toBe(0);
    expect(clampValue(11, 0, 10)).toBe(10);
  });
});

describe('countStepDecimals', () => {
  it('counts the decimals a step carries', () => {
    expect(countStepDecimals(1)).toBe(0);
    expect(countStepDecimals(0.1)).toBe(1);
    expect(countStepDecimals(0.25)).toBe(2);
  });

  it('reads an exponential step, which a naive split on "." would miss', () => {
    // `String(1e-7)` is "1e-7": there is no dot to split on, and the decimal
    // count is the exponent.
    expect(countStepDecimals(1e-7)).toBe(7);
  });
});

describe('roundValueToStep', () => {
  it('snaps to the nearest step', () => {
    expect(roundValueToStep(7, 0, 100, 5)).toBe(5);
    expect(roundValueToStep(8, 0, 100, 5)).toBe(10);
  });

  it('rounds away the float error a fractional step accumulates', () => {
    // 0.1 + 0.2 arithmetic: without the decimal rounding this lands on
    // 0.30000000000000004.
    expect(roundValueToStep(0.3, 0, 1, 0.1)).toBe(0.3);
  });

  it('clamps into the bounds after snapping', () => {
    expect(roundValueToStep(200, 0, 100, 1)).toBe(100);
    expect(roundValueToStep(-5, 0, 100, 1)).toBe(0);
  });

  it('respects a non-zero minimum', () => {
    // Steps are measured FROM `min`, not from zero.
    expect(roundValueToStep(12, 10, 20, 5)).toBe(10);
    expect(roundValueToStep(13, 10, 20, 5)).toBe(15);
  });
});

describe('sliderValueFromPosition', () => {
  it('returns undefined before the control has been laid out', () => {
    // A touch landing before the first layout must not fall back to a value, or
    // the slider snaps to `min`.
    expect(sliderValueFromPosition(50, geometry({ controlSize: undefined }))).toBeUndefined();
    expect(sliderValueFromPosition(50, geometry({ controlSize: 0 }))).toBeUndefined();
  });

  it('maps a position along a horizontal LTR track', () => {
    expect(sliderValueFromPosition(0, geometry())).toBe(0);
    expect(sliderValueFromPosition(100, geometry())).toBe(50);
    expect(sliderValueFromPosition(200, geometry())).toBe(100);
  });

  it('inverts under RTL, where the track runs right to left', () => {
    const rtl = geometry({ direction: 'rtl' });
    expect(sliderValueFromPosition(0, rtl)).toBe(100);
    expect(sliderValueFromPosition(200, rtl)).toBe(0);
  });

  it('inverts when vertical, because the track grows upwards', () => {
    const vertical = geometry({ orientation: 'vertical' });
    expect(sliderValueFromPosition(0, vertical)).toBe(100);
    expect(sliderValueFromPosition(200, vertical)).toBe(0);
  });

  it('clamps a touch that lands outside the control', () => {
    expect(sliderValueFromPosition(-40, geometry())).toBe(0);
    expect(sliderValueFromPosition(400, geometry())).toBe(100);
  });

  it('snaps to the step', () => {
    // Halfway along a 0..100 range is 50, and a step of 20 puts it exactly
    // between 40 and 60 — `Math.round` breaks that tie upwards.
    expect(sliderValueFromPosition(100, geometry({ step: 20 }))).toBe(60);
    // Away from the tie there is nothing to argue about.
    expect(sliderValueFromPosition(90, geometry({ step: 20 }))).toBe(40);
  });
});

describe('sliderPercentFromValue', () => {
  it('is the inverse of the position mapping', () => {
    expect(sliderPercentFromValue(0, 0, 100)).toBe(0);
    expect(sliderPercentFromValue(50, 0, 100)).toBe(0.5);
    expect(sliderPercentFromValue(100, 0, 100)).toBe(1);
  });

  it('returns 0 for a degenerate range rather than dividing by zero', () => {
    expect(sliderPercentFromValue(5, 5, 5)).toBe(0);
  });

  it('clamps a value outside the range', () => {
    expect(sliderPercentFromValue(150, 0, 100)).toBe(1);
    expect(sliderPercentFromValue(-50, 0, 100)).toBe(0);
  });

  it('round-trips with sliderValueFromPosition', () => {
    // What a consumer actually does: convert a touch to a value, then place the
    // thumb from that value. The two must agree.
    const g = geometry();
    const value = sliderValueFromPosition(150, g)!;
    expect(sliderPercentFromValue(value, g.min, g.max)).toBeCloseTo(150 / 200, 5);
  });
});
