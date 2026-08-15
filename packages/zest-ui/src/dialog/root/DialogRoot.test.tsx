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

describe('nested dialogs', () => {
  function NestedDialogs(props: { childOpen?: boolean }) {
    return (
      <Dialog.Root defaultOpen>
        <Dialog.Portal>
          <Dialog.Backdrop
            testID="outer-backdrop"
            style={(state) => {
              backdropStates.push({
                nested: state.nested,
                nestedDialogOpen: state.nestedDialogOpen,
              });
              return undefined;
            }}
          />
          <Dialog.Viewport>
            <Dialog.Popup
              testID="outer-popup"
              style={(state) => {
                outerStates.push({
                  nested: state.nested,
                  nestedDialogOpen: state.nestedDialogOpen,
                  nestedDialogCount: state.nestedDialogCount,
                });
                return undefined;
              }}
            >
              <Dialog.Root open={props.childOpen ?? false}>
                <Dialog.Portal>
                  <Dialog.Viewport>
                    <Dialog.Popup
                      testID="inner-popup"
                      style={(state) => {
                        innerStates.push({
                          nested: state.nested,
                          nestedDialogOpen: state.nestedDialogOpen,
                          nestedDialogCount: state.nestedDialogCount,
                        });
                        return undefined;
                      }}
                    />
                  </Dialog.Viewport>
                </Dialog.Portal>
              </Dialog.Root>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  let outerStates: Array<{ nested: boolean; nestedDialogOpen: boolean; nestedDialogCount: number }> = [];
  let innerStates: Array<{ nested: boolean; nestedDialogOpen: boolean; nestedDialogCount: number }> = [];
  let backdropStates: Array<{ nested: boolean; nestedDialogOpen: boolean }> = [];

  beforeEach(() => {
    outerStates = [];
    innerStates = [];
    backdropStates = [];
  });

  it('marks the inner dialog as nested and the outer one as not', async () => {
    await render(<NestedDialogs childOpen />);

    expect(outerStates.at(-1)!.nested).toBe(false);
    expect(innerStates.at(-1)!.nested).toBe(true);
  });

  it('tells the outer popup and backdrop that a nested dialog is open', async () => {
    const view = await render(<NestedDialogs childOpen={false} />);

    expect(outerStates.at(-1)!.nestedDialogOpen).toBe(false);
    expect(backdropStates.at(-1)!.nestedDialogOpen).toBe(false);

    await view.rerender(<NestedDialogs childOpen />);

    expect(outerStates.at(-1)!.nestedDialogOpen).toBe(true);
    expect(backdropStates.at(-1)!.nestedDialogOpen).toBe(true);
    // The inner dialog has nothing nested inside it.
    expect(innerStates.at(-1)!.nestedDialogOpen).toBe(false);
  });

  it('publishes the depth on nestedDialogCount', async () => {
    await render(<NestedDialogs childOpen />);

    // One dialog is nested inside the outer one.
    expect(outerStates.at(-1)!.nestedDialogCount).toBe(1);
    expect(innerStates.at(-1)!.nestedDialogCount).toBe(0);
  });

  it('clears the count again when the nested dialog closes', async () => {
    const view = await render(<NestedDialogs childOpen />);
    expect(outerStates.at(-1)!.nestedDialogOpen).toBe(true);

    await view.rerender(<NestedDialogs childOpen={false} />);

    expect(outerStates.at(-1)!.nestedDialogOpen).toBe(false);
  });
});
