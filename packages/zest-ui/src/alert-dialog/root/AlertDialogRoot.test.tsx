import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { AlertDialog } from '../index';

function TestAlertDialog(props: React.ComponentProps<typeof AlertDialog.Root>) {
  return (
    <AlertDialog.Root {...props}>
      <AlertDialog.Trigger testID="trigger">
        <Text>Delete</Text>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop testID="backdrop" />
        <AlertDialog.Viewport testID="viewport">
          <AlertDialog.Popup testID="popup">
            <AlertDialog.Title>Delete file?</AlertDialog.Title>
            <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
            <AlertDialog.Close testID="close">
              <Text>Cancel</Text>
            </AlertDialog.Close>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

describe('AlertDialog', () => {
  it('opens via Trigger and closes via Close', async () => {
    const onOpenChange = jest.fn();
    await render(<TestAlertDialog onOpenChange={onOpenChange} />);

    expect(screen.queryByTestId('popup')).toBeNull();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
    expect(screen.getByTestId('popup')).toBeTruthy();

    await user.press(screen.getByTestId('close'));

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'close-press' }),
    );
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('announces itself as an alertdialog rather than a dialog', async () => {
    await render(<TestAlertDialog defaultOpen />);

    expect(screen.getByTestId('popup').props.role).toBe('alertdialog');
  });

  it('never dismisses on an outside press', async () => {
    const onOpenChange = jest.fn();
    await render(<TestAlertDialog defaultOpen onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('viewport'));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('labels the popup with the title element id', async () => {
    await render(<TestAlertDialog defaultOpen />);

    const popup = screen.getByTestId('popup');
    const title = screen.getByText('Delete file?');

    expect(title.props.nativeID).toBeTruthy();
    expect(popup.props.accessibilityLabelledBy).toBe(title.props.nativeID);
  });

  it('respects the controlled open prop', async () => {
    const onOpenChange = jest.fn();
    await render(<TestAlertDialog open={false} onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.queryByTestId('popup')).toBeNull();
  });
});
