import * as React from 'react';
import { Text } from 'react-native';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Dialog } from '../index';

type TreeNode = { type?: string; props?: Record<string, any>; children?: unknown[] };

function findNodeByProp(node: TreeNode, propName: string): TreeNode | null {
  if (node.props && typeof node.props[propName] === 'function') {
    return node;
  }
  for (const child of node.children ?? []) {
    if (typeof child === 'object' && child !== null) {
      const found = findNodeByProp(child as TreeNode, propName);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function TestDialog(props: {
  onOpenChange?: (open: boolean, details: { reason: string; cancel: () => void }) => void;
  open?: boolean;
  defaultOpen?: boolean;
  disablePointerDismissal?: boolean;
}) {
  return (
    <Dialog.Root {...props}>
      <Dialog.Trigger testID="trigger">
        <Text>Open</Text>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop testID="backdrop" />
        <Dialog.Viewport testID="viewport">
          <Dialog.Popup testID="popup">
            <Dialog.Title>Dialog Title</Dialog.Title>
            <Dialog.Description>Dialog description.</Dialog.Description>
            <Dialog.Close testID="close">
              <Text>Close</Text>
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

describe('Dialog', () => {
  it('opens via Trigger and closes via Close', async () => {
    const onOpenChange = jest.fn();
    await render(<TestDialog onOpenChange={onOpenChange} />);

    expect(screen.queryByTestId('popup')).toBeNull();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
    expect(screen.getByTestId('popup')).toBeTruthy();
    expect(screen.getByText('Dialog Title')).toBeTruthy();

    await user.press(screen.getByTestId('close'));

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'close-press' }),
    );
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('closes on outside press via the Viewport with the outside-press reason', async () => {
    const onOpenChange = jest.fn();
    await render(<TestDialog defaultOpen onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('viewport'));

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'outside-press' }),
    );
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('does not dismiss on outside press when disablePointerDismissal is set', async () => {
    await render(<TestDialog defaultOpen disablePointerDismissal />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('viewport'));

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('respects the controlled open prop', async () => {
    const onOpenChange = jest.fn();
    await render(<TestDialog open={false} onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    // Controlled: the dialog only opens when the owner flips the prop.
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('cancels opening when eventDetails.cancel() is called', async () => {
    await render(
      <TestDialog
        onOpenChange={(open, details) => {
          details.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('labels the popup with the title element id', async () => {
    await render(<TestDialog defaultOpen />);

    const popup = screen.getByTestId('popup');
    const title = screen.getByText('Dialog Title');

    expect(popup.props.accessibilityViewIsModal).toBe(true);
    expect(popup.props.role).toBe('dialog');
    expect(title.props.nativeID).toBeTruthy();
    expect(popup.props.accessibilityLabelledBy).toBe(title.props.nativeID);
  });

  it('closes with the escape-key reason when the Modal requests close', async () => {
    const onOpenChange = jest.fn();
    const view = await render(<TestDialog defaultOpen onOpenChange={onOpenChange} />);

    const modal = findNodeByProp(view.container as unknown as TreeNode, 'onRequestClose');
    expect(modal).toBeTruthy();
    await act(async () => {
      modal!.props!.onRequestClose({ nativeEvent: {} });
    });

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'escape-key' }),
    );
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('reflects open state on the trigger accessibility state', async () => {
    await render(<TestDialog defaultOpen />);
    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({
      expanded: true,
    });
  });
});
