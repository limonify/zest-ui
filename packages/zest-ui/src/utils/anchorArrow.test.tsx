import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Menu, Popover, Select, Tooltip } from '../index';

/**
 * floating-ui's `arrow` middleware needs the arrow element to exist and to have
 * been measured. The first position is computed as soon as the anchor and the
 * popup have their refs — before the arrow has laid out — and React Native has
 * nothing that observes layout globally to try again. Without a re-measure the
 * middleware returns no data at all and every arrow sits in its popup's
 * top-left corner.
 *
 * These assert the re-measure happens: the arrow reports a layout, which is what
 * triggers the recompute.
 */
// `Select.Arrow` is `aria-hidden`, so every lookup here opts into hidden elements.
const hidden = { includeHiddenElements: true } as const;

function layout(testID: string, width: number, height: number) {
  return act(async () => {
    fireEvent(screen.getByTestId(testID, hidden), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width, height } },
    });
  });
}

describe('arrow re-measure', () => {
  it('Popover.Arrow reports a layout, so the position can be recomputed', async () => {
    await render(
      <Popover.Root defaultOpen>
        <Popover.Trigger testID="trigger">
          <Text>Open</Text>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom">
            <Popover.Popup testID="popup">
              <Popover.Arrow testID="arrow" />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    const arrow = screen.getByTestId('arrow');
    expect(typeof arrow.props.onLayout).toBe('function');

    // The arrow is absolutely positioned, so without the recompute it would
    // stay pinned to the popup's origin.
    expect(arrow.props.style).toEqual(
      expect.objectContaining({ position: 'absolute' }),
    );

    await layout('arrow', 12, 6);
    // Reporting the same size again must not loop; the guard drops it.
    await layout('arrow', 12, 6);

    expect(screen.getByTestId('arrow')).toBeTruthy();
  });

  it.each([
    ['Menu', 'menu-arrow'],
    ['Select', 'select-arrow'],
    ['Tooltip', 'tooltip-arrow'],
  ])('%s.Arrow carries the same onLayout', async (_name, testID) => {
    const trees: Record<string, React.ReactElement> = {
      'menu-arrow': (
        <Menu.Root defaultOpen>
          <Menu.Trigger testID="t">
            <Text>Open</Text>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Arrow testID="menu-arrow" />
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      ),
      'select-arrow': (
        <Select.Root defaultOpen>
          <Select.Trigger testID="t" />
          <Select.Portal>
            <Select.Positioner>
              <Select.Arrow testID="select-arrow" />
              <Select.Popup />
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      ),
      'tooltip-arrow': (
        <Tooltip.Root defaultOpen>
          <Tooltip.Trigger testID="t">
            <Text>Open</Text>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup>
                <Tooltip.Arrow testID="tooltip-arrow" />
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      ),
    };

    await render(trees[testID]!);

    expect(typeof screen.getByTestId(testID, hidden).props.onLayout).toBe('function');
    await layout(testID, 12, 6);
    expect(screen.getByTestId(testID, hidden)).toBeTruthy();
  });

  it('lets a consumer own onLayout too', async () => {
    const onLayout = jest.fn();

    await render(
      <Popover.Root defaultOpen>
        <Popover.Trigger testID="trigger">
          <Text>Open</Text>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Arrow testID="arrow" onLayout={onLayout} />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    await layout('arrow', 12, 6);

    // The consumer's handler is chained, not replaced.
    expect(onLayout).toHaveBeenCalled();
  });
});
