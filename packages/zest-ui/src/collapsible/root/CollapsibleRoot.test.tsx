import * as React from 'react';
import { Text, View } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Collapsible } from '../index';

function TestCollapsible(props: React.ComponentProps<typeof Collapsible.Root>) {
  return (
    <Collapsible.Root testID="root" {...props}>
      <Collapsible.Trigger testID="trigger">
        <Text>Toggle</Text>
      </Collapsible.Trigger>
      <Collapsible.Panel testID="panel">
        <Text>Panel content</Text>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

describe('Collapsible', () => {
  it('opens and closes via the Trigger when uncontrolled', async () => {
    const onOpenChange = jest.fn();
    await render(<TestCollapsible onOpenChange={onOpenChange} />);

    expect(screen.queryByTestId('panel')).toBeNull();
    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({
      expanded: false,
    });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'trigger-press' }),
    );
    expect(screen.getByTestId('panel')).toBeTruthy();
    expect(screen.getByText('Panel content')).toBeTruthy();
    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({
      expanded: true,
    });

    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
    expect(screen.queryByTestId('panel')).toBeNull();
  });

  it('honors defaultOpen', async () => {
    await render(<TestCollapsible defaultOpen />);

    expect(screen.getByTestId('panel')).toBeTruthy();
    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({ expanded: true });
  });

  it('respects the controlled open prop', async () => {
    const onOpenChange = jest.fn();
    await render(<TestCollapsible open={false} onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    // Controlled: the panel only opens when the owner flips the prop.
    expect(screen.queryByTestId('panel')).toBeNull();
  });

  it('cancels the state change when eventDetails.cancel() is called', async () => {
    await render(
      <TestCollapsible
        onOpenChange={(open, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.queryByTestId('panel')).toBeNull();
  });

  it('ignores presses when disabled', async () => {
    const onOpenChange = jest.fn();
    await render(<TestCollapsible disabled onOpenChange={onOpenChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('trigger').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('keeps the panel rendered but hidden from accessibility when keepMounted and closed', async () => {
    await render(
      <Collapsible.Root testID="root">
        <Collapsible.Trigger testID="trigger">
          <Text>Toggle</Text>
        </Collapsible.Trigger>
        <Collapsible.Panel testID="panel" keepMounted>
          <Text>Panel content</Text>
        </Collapsible.Panel>
      </Collapsible.Root>,
    );

    // The closed panel is still rendered, but hidden from the accessibility tree —
    // so, like a screen reader, the default query cannot see it.
    expect(screen.queryByTestId('panel')).toBeNull();

    const panel = screen.getByTestId('panel', { includeHiddenElements: true });
    expect(panel.props.accessibilityElementsHidden).toBe(true);
    expect(panel.props.importantForAccessibility).toBe('no-hide-descendants');

    const user = userEvent.setup();
    await user.press(screen.getByTestId('trigger'));

    expect(screen.getByTestId('panel').props.accessibilityElementsHidden).toBe(false);
    expect(screen.getByTestId('panel').props.importantForAccessibility).toBe('auto');
  });

  it('links the trigger to the panel via aria-controls when open', async () => {
    await render(<TestCollapsible defaultOpen />);

    const trigger = screen.getByTestId('trigger');
    const panel = screen.getByTestId('panel');

    expect(panel.props.nativeID).toBeTruthy();
    expect(trigger.props['aria-controls']).toBe(panel.props.nativeID);
  });

  it('publishes the measured content height on the panel state', async () => {
    const styleFn = jest.fn(() => ({}));
    await render(
      <Collapsible.Root defaultOpen>
        <Collapsible.Trigger testID="trigger">
          <Text>Toggle</Text>
        </Collapsible.Trigger>
        <Collapsible.Panel testID="panel" style={styleFn}>
          <View testID="content" />
        </Collapsible.Panel>
      </Collapsible.Root>,
    );

    // The panel measures an inner wrapper, since its own size is consumer-driven.
    const contentWrapper = screen.getByTestId('content').parent!;
    await act(async () => {
      fireEvent(contentWrapper, 'layout', {
        nativeEvent: { layout: { height: 120, width: 300, x: 0, y: 0 } },
      });
    });

    expect(styleFn).toHaveBeenLastCalledWith(
      expect.objectContaining({ height: 120, width: 300, open: true }),
    );
  });

  it('exposes transitionStatus to the panel state', async () => {
    const styleFn = jest.fn(() => ({}));
    await render(
      <Collapsible.Root defaultOpen>
        <Collapsible.Panel testID="panel" style={styleFn}>
          <Text>Panel content</Text>
        </Collapsible.Panel>
      </Collapsible.Root>,
    );

    // An initially-open panel settles on 'idle' rather than animating in.
    expect(styleFn).toHaveBeenLastCalledWith(expect.objectContaining({ transitionStatus: 'idle' }));
  });
});
