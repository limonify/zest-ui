import * as React from 'react';
import { View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Menu } from '../index';

function TestMenu(props: { side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <Menu.Root defaultOpen>
      <Menu.Portal>
        <Menu.Positioner side={props.side} testID="positioner">
          <Menu.Popup testID="popup">
            <Menu.Arrow testID="arrow" />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

describe('Menu.Arrow', () => {
  it('renders inside an open menu, absolutely positioned', async () => {
    await render(<TestMenu />);

    const arrow = screen.getByTestId('arrow');

    expect(arrow).toBeTruthy();
    expect(arrow.props.style).toEqual(
      expect.objectContaining({ position: 'absolute' }),
    );
  });

  it('exposes open, side and align on its state', async () => {
    const styleFn = jest.fn(() => ({}));

    await render(
      <Menu.Root defaultOpen>
        <Menu.Portal>
          <Menu.Positioner side="top" align="start">
            <Menu.Popup>
              <Menu.Arrow testID="arrow" style={styleFn} />
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expect(styleFn).toHaveBeenLastCalledWith(
      expect.objectContaining({ open: true, side: 'top', align: 'start' }),
    );
  });

  it('can be replaced through the render prop', async () => {
    await render(
      <Menu.Root defaultOpen>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Arrow render={(props) => <View {...props} testID="custom-arrow" />} />
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expect(screen.getByTestId('custom-arrow')).toBeTruthy();
  });

  it('is not rendered while the menu is closed', async () => {
    await render(
      <Menu.Root>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Arrow testID="arrow" />
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expect(screen.queryByTestId('arrow')).toBeNull();
  });
});
