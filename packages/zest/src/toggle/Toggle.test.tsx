import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Toggle } from '../index';

describe('Toggle', () => {
  it('toggles when uncontrolled', async () => {
    const onPressedChange = jest.fn();
    await render(
      <Toggle testID="toggle" onPressedChange={onPressedChange}>
        <Text>Bold</Text>
      </Toggle>,
    );

    const toggle = screen.getByTestId('toggle');
    expect(toggle.props.accessibilityRole).toBe('button');
    expect(toggle.props.accessibilityState).toMatchObject({ selected: false });

    const user = userEvent.setup();
    await user.press(toggle);

    expect(onPressedChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'none' }));
    expect(screen.getByTestId('toggle').props.accessibilityState).toMatchObject({ selected: true });

    await user.press(toggle);
    expect(screen.getByTestId('toggle').props.accessibilityState).toMatchObject({ selected: false });
  });

  it('respects the controlled pressed prop', async () => {
    const onPressedChange = jest.fn();
    await render(<Toggle testID="toggle" pressed onPressedChange={onPressedChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('toggle'));

    expect(onPressedChange).toHaveBeenCalledWith(false, expect.anything());
    expect(screen.getByTestId('toggle').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('honors defaultPressed', async () => {
    await render(<Toggle testID="toggle" defaultPressed />);
    expect(screen.getByTestId('toggle').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('cancels the state change when eventDetails.cancel() is called', async () => {
    await render(
      <Toggle
        testID="toggle"
        onPressedChange={(pressed, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('toggle'));

    expect(screen.getByTestId('toggle').props.accessibilityState).toMatchObject({ selected: false });
  });

  it('ignores presses when disabled', async () => {
    const onPressedChange = jest.fn();
    await render(<Toggle testID="toggle" disabled onPressedChange={onPressedChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('toggle'));

    expect(onPressedChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('toggle').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('exposes state to the style function', async () => {
    await render(
      <Toggle
        testID="toggle"
        defaultPressed
        style={(state) => ({ opacity: state.pressed ? 1 : 0.5 })}
      />,
    );

    expect(screen.getByTestId('toggle')).toHaveStyle({ opacity: 1 });
  });
});
