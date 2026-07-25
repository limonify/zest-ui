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

describe('ContextMenu placement', () => {
  // jest-expo reports a 750x1334 window, so these coordinates are relative to that.
  async function layoutPositioner(width: number, height: number) {
    await act(async () => {
      fireEvent(screen.getByTestId('positioner', hidden), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width, height } },
      });
    });
  }

  function positionerStyle() {
    return screen.getByTestId('positioner', hidden).props.style;
  }

  it('hangs below and right of the press point when there is room', async () => {
    await render(<TestContextMenu />);
    await longPress('trigger', 100, 200);
    await layoutPositioner(200, 300);

    expect(positionerStyle()).toMatchObject({ left: 100, top: 200 });
  });

  it('flips to the other side of the press point rather than running off screen', async () => {
    await render(<TestContextMenu />);
    // Near the bottom-right corner: a 200x300 popup would overflow both edges.
    await longPress('trigger', 700, 1300);
    await layoutPositioner(200, 300);

    const style = positionerStyle();
    expect(style).toMatchObject({ left: 500, top: 1000 });
  });

  it('reports the placement it actually used on state', async () => {
    const seen: Array<{ side: string; align: string }> = [];

    await render(
      <ContextMenu.Root>
        <ContextMenu.Trigger testID="trigger">
          <Text>Long press me</Text>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner
            testID="positioner"
            style={(state) => {
              seen.push({ side: state.side, align: state.align });
              return undefined;
            }}
          >
            <ContextMenu.Popup testID="popup" />
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>,
    );

    await longPress('trigger', 700, 1300);
    await layoutPositioner(200, 300);

    expect(seen.at(-1)).toEqual({ side: 'top', align: 'end' });
  });

  it('keeps a popup larger than the screen inside the collision padding', async () => {
    await render(<TestContextMenu />);
    await longPress('trigger', 700, 1300);
    await layoutPositioner(2000, 4000);

    expect(positionerStyle()).toMatchObject({ left: 5, top: 5 });
  });
});
