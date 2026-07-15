import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Checkbox } from '../index';

describe('Checkbox.Root', () => {
  it('toggles when uncontrolled', async () => {
    const onCheckedChange = jest.fn();
    await render(
      <Checkbox.Root testID="checkbox" onCheckedChange={onCheckedChange}>
        <Checkbox.Indicator testID="indicator" />
      </Checkbox.Root>,
    );

    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox.props.accessibilityRole).toBe('checkbox');
    expect(checkbox.props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.queryByTestId('indicator')).toBeNull();

    const user = userEvent.setup();
    await user.press(checkbox);

    expect(onCheckedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: 'none' }),
    );
    expect(screen.getByTestId('checkbox').props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByTestId('indicator')).toBeTruthy();

    await user.press(checkbox);
    expect(screen.getByTestId('checkbox').props.accessibilityState).toMatchObject({
      checked: false,
    });
    expect(screen.queryByTestId('indicator')).toBeNull();
  });

  it('respects the controlled checked prop', async () => {
    const onCheckedChange = jest.fn();
    await render(
      <Checkbox.Root testID="checkbox" checked onCheckedChange={onCheckedChange} />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('checkbox'));

    // Controlled: internal state must not flip on its own.
    expect(onCheckedChange).toHaveBeenCalledWith(false, expect.anything());
    expect(screen.getByTestId('checkbox').props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it('cancels the state change when eventDetails.cancel() is called', async () => {
    await render(
      <Checkbox.Root
        testID="checkbox"
        onCheckedChange={(checked, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('checkbox'));

    expect(screen.getByTestId('checkbox').props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it('reports mixed accessibility state when indeterminate', async () => {
    await render(
      <Checkbox.Root testID="checkbox" indeterminate>
        <Checkbox.Indicator testID="indicator" />
      </Checkbox.Root>,
    );

    expect(screen.getByTestId('checkbox').props.accessibilityState).toMatchObject({
      checked: 'mixed',
    });
    // Indeterminate renders the indicator even when unchecked.
    expect(screen.getByTestId('indicator')).toBeTruthy();
  });

  it('ignores presses when disabled or readOnly', async () => {
    const onCheckedChange = jest.fn();
    const user = userEvent.setup();

    await render(
      <Checkbox.Root testID="disabled" disabled onCheckedChange={onCheckedChange} />,
    );
    await user.press(screen.getByTestId('disabled'));
    expect(onCheckedChange).not.toHaveBeenCalled();

    await render(
      <Checkbox.Root testID="readonly" readOnly onCheckedChange={onCheckedChange} />,
    );
    await user.press(screen.getByTestId('readonly'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('exposes state to render functions of the Indicator', async () => {
    await render(
      <Checkbox.Root testID="checkbox" defaultChecked>
        <Checkbox.Indicator
          render={(props, state) => (
            <Text {...props}>{state.checked ? 'checked' : 'unchecked'}</Text>
          )}
        />
      </Checkbox.Root>,
    );

    expect(screen.getByText('checked')).toBeTruthy();
  });
});
