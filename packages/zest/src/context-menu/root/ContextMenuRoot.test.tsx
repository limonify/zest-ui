import * as React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { ContextMenu } from '../../index';

const hidden = { includeHiddenElements: true } as const;

function TestContextMenu(props: React.ComponentProps<typeof ContextMenu.Root>) {
  return (
    <ContextMenu.Root {...props}>
      <ContextMenu.Trigger testID="trigger">
        <Text>Long press me</Text>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Backdrop testID="backdrop" />
        <ContextMenu.Positioner testID="positioner">
          <ContextMenu.Popup testID="popup">
            <ContextMenu.Item testID="item-copy" onPress={() => {}}>
              <Text>Copy</Text>
            </ContextMenu.Item>
            <ContextMenu.Item testID="item-delete" onPress={() => {}}>
              <Text>Delete</Text>
            </ContextMenu.Item>
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

async function longPress(testID: string, pageX = 120, pageY = 240) {
  await act(async () => {
    fireEvent(screen.getByTestId(testID), 'longPress', {
      nativeEvent: { pageX, pageY },
    });
  });
}

describe('ContextMenu', () => {
  it('is closed until the trigger is long-pressed', async () => {
    await render(<TestContextMenu />);
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('opens on long press', async () => {
    const onOpenChange = jest.fn();
    await render(<TestContextMenu onOpenChange={onOpenChange} />);

    await longPress('trigger');

    expect(screen.getByTestId('popup')).toBeTruthy();
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press' }));
  });

  it('anchors the popup to the press point', async () => {
    await render(<TestContextMenu />);

    await longPress('trigger', 150, 300);

    const positioner = screen.getByTestId('positioner');
    expect(positioner.props.style).toMatchObject({ position: 'absolute', left: 150, top: 300 });
  });

  it('closes when an item is pressed', async () => {
    await render(<TestContextMenu />);

    await longPress('trigger');
    const user = userEvent.setup();
    await user.press(screen.getByTestId('item-copy'));

    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('closes on an outside press via the backdrop', async () => {
    const onOpenChange = jest.fn();
    await render(<TestContextMenu onOpenChange={onOpenChange} />);

    await longPress('trigger');
    const user = userEvent.setup();
    await user.press(screen.getByTestId('backdrop', hidden));

    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'outside-press' }),
    );
  });
});
