import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Popover } from '../index';

function TestPopover(props: React.ComponentProps<typeof Popover.Root>) {
  return (
    <Popover.Root {...props}>
      <Popover.Trigger testID="trigger">
        <Text>Open</Text>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Backdrop testID="backdrop" />
        <Popover.Positioner testID="positioner" side="top" sideOffset={8}>
          <Popover.Popup testID="popup">
            <Popover.Arrow testID="arrow" />
            <Popover.Title>Popover title</Popover.Title>
            <Popover.Description>Popover description.</Popover.Description>
            <Popover.Close testID="close">
              <Text>Close</Text>
            </Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

describe('Popover', () => {
  it('opens via Trigger and closes via Close', async () => {
    const onOpenChange = jest.fn();
    await render(<TestPopover onOpenChange={onOpenChange} />);

    expect(screen.queryByTestId('popup')).toBeNull();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
    expect(screen.getByTestId('popup')).toBeTruthy();
    expect(screen.getByText('Popover title')).toBeTruthy();

    await user.press(screen.getByTestId('close'));

    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'close-press' }),
    );
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('toggles closed when the trigger is pressed again', async () => {
    const onOpenChange = jest.fn();
    await render(<TestPopover defaultOpen onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('closes on an outside press via the Backdrop', async () => {
    const onOpenChange = jest.fn();
    await render(<TestPopover defaultOpen onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('backdrop'));

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'outside-press' }),
    );
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('does not dismiss on an outside press when disablePointerDismissal is set', async () => {
    await render(<TestPopover defaultOpen disablePointerDismissal />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('backdrop'));

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('respects the controlled open prop', async () => {
    const onOpenChange = jest.fn();
    await render(<TestPopover open={false} onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('cancels opening when eventDetails.cancel() is called', async () => {
    await render(
      <TestPopover
        onOpenChange={(open, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('labels the popup with the title and describes it with the description', async () => {
    await render(<TestPopover defaultOpen />);

    const popup = screen.getByTestId('popup');
    const title = screen.getByText('Popover title');
    const description = screen.getByText('Popover description.');

    expect(popup.props.role).toBe('dialog');
    expect(title.props.nativeID).toBeTruthy();
    expect(popup.props.accessibilityLabelledBy).toBe(title.props.nativeID);
    expect(popup.props['aria-describedby']).toBe(description.props.nativeID);
  });

  it('reflects the open state on the trigger accessibility state', async () => {
    await render(<TestPopover defaultOpen />);

    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({
      expanded: true,
    });
    expect(screen.getByTestId('trigger').props['aria-haspopup']).toBe('dialog');
  });

  it('positions the positioner absolutely and exposes the resolved side', async () => {
    const styleFn = jest.fn(() => ({}));
    await render(
      <Popover.Root defaultOpen>
        <Popover.Trigger testID="trigger">
          <Text>Open</Text>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner testID="positioner" side="top" style={styleFn}>
            <Popover.Popup testID="popup">
              <Text>Content</Text>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    expect(screen.getByTestId('positioner')).toHaveStyle({ position: 'absolute' });
    // Without a measured anchor floating-ui reports the requested side.
    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ side: 'top', open: true }));
  });

  it('throws when a part is used outside the root', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      render(
        <Popover.Trigger>
          <Text>Orphan</Text>
        </Popover.Trigger>,
      ),
    ).rejects.toThrow(/PopoverRootContext is missing/);

    consoleError.mockRestore();
  });
});
