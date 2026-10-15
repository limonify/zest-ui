import { computePosition, flip, type Platform, type Rect } from '@floating-ui/core';
import { anchorFlipOptions } from './useAnchorPositioning';

/**
 * `anchorFlipOptions` run through floating-ui's own engine against a fixed
 * screen, so the assertions are about where a popup actually LANDS rather than
 * about which options were passed.
 */
const SCREEN = { x: 0, y: 0, width: 393, height: 852 };

function platform(anchor: Rect, floating: { width: number; height: number }): Platform {
  return {
    getElementRects: () => ({ reference: anchor, floating: { x: 0, y: 0, ...floating } }),
    getClippingRect: () => SCREEN,
    getDimensions: () => floating,
  };
}

async function place(anchor: Rect, floating: { width: number; height: number }, placement: 'right-start' | 'bottom-start') {
  const result = await computePosition({}, {}, {
    placement,
    platform: platform(anchor, floating),
    middleware: [flip(anchorFlipOptions(5))],
  });
  return result.placement;
}

describe('anchorFlipOptions', () => {
  // The submenu that ran off a 393pt phone: its trigger row spans most of the
  // parent menu, which spans most of the screen, so neither `right` nor `left`
  // has room for a 190pt list.
  it('drops a popup below its anchor when neither side of the axis has room', async () => {
    const row = { x: 35, y: 400, width: 190, height: 44 };
    expect(await place(row, { width: 190, height: 140 }, 'right-start')).toMatch(/^bottom/);
  });

  it('still flips to the opposite side when that side has room', async () => {
    const row = { x: 240, y: 400, width: 100, height: 44 };
    expect(await place(row, { width: 120, height: 140 }, 'right-start')).toMatch(/^left/);
  });

  // The leak `crossAxis: 'alignment'` exists to stop: a `bottom` popover only a
  // little too wide for the screen is `shift`'s to fix, not a reason to leave
  // the bottom for a side.
  it('keeps a popover on its side when it only overflows across the axis', async () => {
    const trigger = { x: 320, y: 200, width: 80, height: 40 };
    expect(await place(trigger, { width: 300, height: 100 }, 'bottom-start')).toMatch(/^bottom/);
  });
});
