import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Switch } from '../index';

describe('Switch.Root', () => {
  it('toggles when uncontrolled', async () => {
    const onCheckedChange = jest.fn();
    await render(
      <Switch.Root testID="switch" onCheckedChange={onCheckedChange}>
        <Switch.Thumb testID="thumb" />
      </Switch.Root>,
    );

    const switchEl = screen.getByTestId('switch');
    expect(switchEl.props.accessibilityRole).toBe('switch');
    expect(switchEl.props.accessibilityState).toMatchObject({ checked: false });
    // Unlike the Checkbox indicator, the thumb is always mounted.
    expect(screen.getByTestId('thumb')).toBeTruthy();

    const user = userEvent.setup();
    await user.press(switchEl);

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'none' }));
    expect(screen.getByTestId('switch').props.accessibilityState).toMatchObject({ checked: true });

    await user.press(switchEl);
    expect(screen.getByTestId('switch').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('respects the controlled checked prop', async () => {
    const onCheckedChange = jest.fn();
    await render(<Switch.Root testID="switch" checked onCheckedChange={onCheckedChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('switch'));

    expect(onCheckedChange).toHaveBeenCalledWith(false, expect.anything());
    expect(screen.getByTestId('switch').props.accessibilityState).toMatchObject({ checked: true });
  });

  it('cancels the state change when eventDetails.cancel() is called', async () => {
    await render(
      <Switch.Root
        testID="switch"
        onCheckedChange={(checked, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('switch'));

    expect(screen.getByTestId('switch').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('ignores presses when disabled or readOnly', async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();

    await render(<Switch.Root testID="disabled" disabled onCheckedChange={onCheckedChange} />);
    await user.press(screen.getByTestId('disabled'));
    expect(onCheckedChange).not.toHaveBeenCalled();

    await render(<Switch.Root testID="readonly" readOnly onCheckedChange={onCheckedChange} />);
    await user.press(screen.getByTestId('readonly'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('marks readOnly and required through aria props', async () => {
    await render(<Switch.Root testID="switch" readOnly required />);

    const switchEl = screen.getByTestId('switch');
    expect(switchEl.props['aria-readonly']).toBe(true);
    expect(switchEl.props['aria-required']).toBe(true);
  });

  it('exposes root state to the Thumb style and render functions', async () => {
    await render(
      <Switch.Root testID="switch" defaultChecked>
        <Switch.Thumb render={(props, state) => <Text {...props}>{state.checked ? 'on' : 'off'}</Text>} />
      </Switch.Root>,
    );

    expect(screen.getByText('on')).toBeTruthy();
  });
});
