import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders an accessible button and fires onPress', async () => {
    const onPress = jest.fn();
    await render(
      <Button testID="btn" onPress={onPress}>
        <Text>Save</Text>
      </Button>,
    );

    const button = screen.getByTestId('btn');
    expect(button.props.accessibilityRole).toBe('button');

    const user = userEvent.setup();
    await user.press(screen.getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('blocks interaction and reflects state when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Button testID="btn" disabled onPress={onPress}>
        <Text>Save</Text>
      </Button>,
    );

    const button = screen.getByTestId('btn');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });

    const user = userEvent.setup();
    await user.press(screen.getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('passes pressed state to style functions', async () => {
    const styleFn = jest.fn((state: Button.State) => ({
      opacity: state.pressed ? 0.5 : 1,
    }));

    await render(
      <Button testID="btn" style={styleFn}>
        <Text>Save</Text>
      </Button>,
    );

    expect(styleFn).toHaveBeenCalledWith(expect.objectContaining({ pressed: false }));

    const user = userEvent.setup();
    await user.press(screen.getByTestId('btn'));

    // During the press lifecycle the style function observes pressed: true.
    expect(styleFn.mock.calls.some(([state]) => state.pressed === true)).toBe(true);
  });

  it('chains user press-in handlers before internal ones', async () => {
    const onPressIn = jest.fn();
    await render(
      <Button testID="btn" onPressIn={onPressIn}>
        <Text>Save</Text>
      </Button>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('btn'));
    expect(onPressIn).toHaveBeenCalled();
  });
});
