import * as React from 'react';
import { Text } from 'react-native';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Tooltip } from '../index';

type TreeNode = { type?: string; props?: Record<string, any>; children?: unknown[] };

/** The portal's dismissal surface ships no testID, so find it by its responder handler. */
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

function TestTooltip(props: React.ComponentProps<typeof Tooltip.Root> & { longPress?: boolean }) {
  const { longPress, ...rootProps } = props;

  return (
    <Tooltip.Root {...rootProps}>
      <Tooltip.Trigger testID="trigger" longPress={longPress}>
        <Text>Help</Text>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner testID="positioner" side="top" sideOffset={4}>
          <Tooltip.Popup testID="popup">
            <Tooltip.Arrow testID="arrow" />
            <Text>Tooltip content</Text>
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

describe('Tooltip', () => {
  it('opens on press, since touch screens have no hover', async () => {
    const onOpenChange = jest.fn();
    await render(<TestTooltip onOpenChange={onOpenChange} />);

    expect(screen.queryByTestId('popup')).toBeNull();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
    expect(screen.getByTestId('popup')).toBeTruthy();
    expect(screen.getByText('Tooltip content')).toBeTruthy();
  });

  it('opens on long press when longPress is set, leaving the press free', async () => {
    const onOpenChange = jest.fn();
    await render(<TestTooltip longPress onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.longPress(screen.getByTestId('trigger'));
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('closes on an outside press', async () => {
    const onOpenChange = jest.fn();
    const view = await render(<TestTooltip defaultOpen onOpenChange={onOpenChange} />);

    // Search inside the Modal: Pressable uses responder handlers internally, so
    // the Trigger would otherwise match first.
    const modal = findNodeByProp(view.container as unknown as TreeNode, 'onRequestClose');
    const surface = findNodeByProp(modal!, 'onResponderRelease');
    expect(surface).toBeTruthy();
    await act(async () => {
      surface!.props!.onResponderRelease({ nativeEvent: {} });
    });

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'outside-press' }),
    );
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('closes with the escape-key reason when the Modal requests close', async () => {
    const onOpenChange = jest.fn();
    const view = await render(<TestTooltip defaultOpen onOpenChange={onOpenChange} />);

    const modal = findNodeByProp(view.container as unknown as TreeNode, 'onRequestClose');
    await act(async () => {
      modal!.props!.onRequestClose({ nativeEvent: {} });
    });

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: 'escape-key' }),
    );
  });

  it('respects the controlled open prop', async () => {
    const onOpenChange = jest.fn();
    await render(<TestTooltip open={false} onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('cancels opening when eventDetails.cancel() is called', async () => {
    await render(
      <TestTooltip
        onOpenChange={(open, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('ignores presses when the trigger is disabled', async () => {
    const onOpenChange = jest.fn();
    await render(
      <Tooltip.Root onOpenChange={onOpenChange}>
        <Tooltip.Trigger testID="trigger" disabled>
          <Text>Help</Text>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup testID="popup">
              <Text>Tooltip content</Text>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId('popup')).toBeNull();
    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('exposes the tooltip role and the resolved side', async () => {
    const styleFn = jest.fn(() => ({}));
    await render(
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger testID="trigger">
          <Text>Help</Text>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner testID="positioner" side="top" style={styleFn}>
            <Tooltip.Popup testID="popup">
              <Text>Tooltip content</Text>
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>,
    );

    expect(screen.getByTestId('popup').props.role).toBe('tooltip');
    expect(screen.getByTestId('positioner')).toHaveStyle({ position: 'absolute' });
    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ side: 'top', open: true }));
  });
});

describe('Tooltip parity with the other popups', () => {
  it('cannot be opened while disabled', async () => {
    const onOpenChange = jest.fn();
    await render(<TestTooltip disabled onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.queryByTestId('popup')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('trigger').props.accessibilityState.disabled).toBe(true);
  });

  it('still closes when it is disabled while open', async () => {
    // Disabling only blocks opening — an already-open tooltip must still be
    // dismissible, or it would be stuck on screen.
    const view = await render(<TestTooltip defaultOpen />);
    expect(screen.getByTestId('popup')).toBeTruthy();

    await view.rerender(<TestTooltip defaultOpen disabled />);

    const modal = findNodeByProp(view.container as unknown as TreeNode, 'onRequestClose');
    const surface = findNodeByProp(modal!, 'onResponderRelease');
    await act(async () => {
      surface!.props!.onResponderRelease({});
    });

    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('stays open on an outside press when dismissal is disabled', async () => {
    const view = await render(<TestTooltip defaultOpen disablePointerDismissal />);

    const modal = findNodeByProp(view.container as unknown as TreeNode, 'onRequestClose');
    const surface = findNodeByProp(modal!, 'onResponderRelease');
    await act(async () => {
      surface!.props!.onResponderRelease({});
    });

    expect(screen.getByTestId('popup')).toBeTruthy();
  });

  it('opens and closes through a handle from a detached trigger', async () => {
    const handle = Tooltip.createHandle();

    await render(
      <>
        <Tooltip.Trigger testID="trigger" nativeID="help-trigger" handle={handle}>
          <Text>Help</Text>
        </Tooltip.Trigger>
        <Tooltip.Root handle={handle}>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Popup testID="popup">
                <Text>Tooltip content</Text>
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </>,
    );

    expect(screen.queryByTestId('popup')).toBeNull();

    await act(async () => {
      handle.open('help-trigger');
    });
    expect(screen.getByTestId('popup')).toBeTruthy();
    expect(handle.isOpen).toBe(true);

    await act(async () => {
      handle.close();
    });
    expect(screen.queryByTestId('popup')).toBeNull();
  });

  it('hands a detached trigger payload to the root children', async () => {
    const handle = Tooltip.createHandle<{ topic: string }>();

    await render(
      <>
        <Tooltip.Trigger testID="trigger" nativeID="t" handle={handle} payload={{ topic: 'billing' }}>
          <Text>Help</Text>
        </Tooltip.Trigger>
        <Tooltip.Root handle={handle}>
          {(payload) => (
            <Tooltip.Portal>
              <Tooltip.Positioner>
                <Tooltip.Popup testID="popup">
                  <Text>{payload?.topic ?? 'none'}</Text>
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          )}
        </Tooltip.Root>
      </>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.getByTestId('popup')).toHaveTextContent('billing');
  });

  it('closes through actionsRef without firing onOpenChange for the unmount', async () => {
    const actionsRef = React.createRef<Tooltip.Root.Actions>();
    const onOpenChange = jest.fn();

    await render(
      <TestTooltip defaultOpen actionsRef={actionsRef} onOpenChange={onOpenChange} />,
    );

    await act(async () => {
      actionsRef.current!.unmount();
    });

    expect(screen.queryByTestId('popup')).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('reports the imperative-action reason when actionsRef closes it', async () => {
    const actionsRef = React.createRef<Tooltip.Root.Actions>();
    const onOpenChange = jest.fn();

    await render(
      <TestTooltip defaultOpen actionsRef={actionsRef} onOpenChange={onOpenChange} />,
    );

    await act(async () => {
      actionsRef.current!.close();
    });

    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'imperative-action' }),
    );
  });

  it('throws when a trigger has neither a root nor a handle', async () => {
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(
        render(
          <Tooltip.Trigger>
            <Text>Help</Text>
          </Tooltip.Trigger>,
        ),
      ).rejects.toThrow(/must be placed within <Tooltip.Root>/);
    } finally {
      warn.mockRestore();
    }
  });
});
