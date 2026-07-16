import * as React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Select } from '../index';

function TestSelect() {
  return (
    <Select.Root>
      <Select.Trigger testID="trigger">
        <Select.Value testID="value" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner testID="positioner">
          <Select.Arrow testID="arrow" />
          <Select.Popup testID="popup" />
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

describe('Select.Arrow', () => {
  it('renders inside the open popup and is positioned absolutely', async () => {
    await render(<TestSelect />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    // The arrow is `aria-hidden`, so queries must opt in to hidden elements.
    const arrow = screen.getByTestId('arrow', { includeHiddenElements: true });
    expect(arrow).toBeTruthy();
    expect(arrow.props.style).toMatchObject({ position: 'absolute' });
  });

  it('is hidden from assistive technology', async () => {
    await render(<TestSelect />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(
      screen.getByTestId('arrow', { includeHiddenElements: true }).props['aria-hidden'],
    ).toBe(true);
  });

  it('exposes side and open on its state', async () => {
    let seenState: Select.Arrow.State | undefined;

    await render(
      <Select.Root>
        <Select.Trigger testID="trigger">
          <Select.Value testID="value" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Arrow
              testID="arrow"
              style={(state) => {
                seenState = state;
                return null;
              }}
            />
            <Select.Popup testID="popup" />
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(seenState?.open).toBe(true);
    expect(seenState?.side).toBeTruthy();
  });
});
