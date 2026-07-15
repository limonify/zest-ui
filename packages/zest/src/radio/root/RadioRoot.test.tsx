import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Radio, RadioGroup } from '../../index';

function TestGroup(props: React.ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup testID="group" {...props}>
      <Radio.Root testID="apple" value="apple">
        <Radio.Indicator testID="apple-indicator" />
      </Radio.Root>
      <Radio.Root testID="banana" value="banana">
        <Radio.Indicator testID="banana-indicator" />
      </Radio.Root>
    </RadioGroup>
  );
}

describe('Radio', () => {
  it('selects a value when uncontrolled and deselects the previous one', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup defaultValue="apple" onValueChange={onValueChange} />);

    expect(screen.getByTestId('apple').props.accessibilityRole).toBe('radio');
    expect(screen.getByTestId('apple').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId('apple-indicator')).toBeTruthy();
    expect(screen.queryByTestId('banana-indicator')).toBeNull();

    const user = userEvent.setup();
    await user.press(screen.getByTestId('banana'));

    expect(onValueChange).toHaveBeenCalledWith('banana', expect.objectContaining({ reason: 'none' }));
    expect(screen.getByTestId('apple').props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.getByTestId('banana').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.queryByTestId('apple-indicator')).toBeNull();
    expect(screen.getByTestId('banana-indicator')).toBeTruthy();
  });

  it('respects the controlled value prop', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup value="apple" onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('banana'));

    expect(onValueChange).toHaveBeenCalledWith('banana', expect.anything());
    // Controlled: the group only changes when the owner flips the prop.
    expect(screen.getByTestId('apple').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId('banana').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('cancels the value change when eventDetails.cancel() is called', async () => {
    await render(
      <TestGroup
        defaultValue="apple"
        onValueChange={(value, eventDetails) => {
          eventDetails.cancel();
        }}
      />,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('banana'));

    expect(screen.getByTestId('apple').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId('banana').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('propagates disabled from the group to its radios', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup disabled onValueChange={onValueChange} />);

    expect(screen.getByTestId('apple').props.accessibilityState).toMatchObject({ disabled: true });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('apple'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('supports disabling a single radio', async () => {
    const onValueChange = jest.fn();
    await render(
      <RadioGroup testID="group" onValueChange={onValueChange}>
        <Radio.Root testID="apple" value="apple" disabled />
        <Radio.Root testID="banana" value="banana" />
      </RadioGroup>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('apple'));
    expect(onValueChange).not.toHaveBeenCalled();

    await user.press(screen.getByTestId('banana'));
    expect(onValueChange).toHaveBeenCalledWith('banana', expect.anything());
  });

  it('ignores presses when the group is readOnly', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup readOnly onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('apple'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('apple').props['aria-readonly']).toBe(true);
  });

  it('exposes the radiogroup role and aria props on the group', async () => {
    await render(<TestGroup required readOnly />);

    const group = screen.getByTestId('group');
    expect(group.props.accessibilityRole).toBe('radiogroup');
    expect(group.props['aria-required']).toBe(true);
    expect(group.props['aria-readonly']).toBe(true);
  });

  it('supports non-string values', async () => {
    const onValueChange = jest.fn();
    await render(
      <RadioGroup<number> defaultValue={1} onValueChange={onValueChange}>
        <Radio.Root testID="one" value={1} />
        <Radio.Root testID="two" value={2} />
      </RadioGroup>,
    );

    expect(screen.getByTestId('one').props.accessibilityState).toMatchObject({ checked: true });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('two'));

    expect(onValueChange).toHaveBeenCalledWith(2, expect.anything());
    expect(screen.getByTestId('two').props.accessibilityState).toMatchObject({ checked: true });
  });

  it('exposes root state to the Indicator render function', async () => {
    await render(
      <RadioGroup defaultValue="apple">
        <Radio.Root testID="apple" value="apple">
          <Radio.Indicator render={(props, state) => <Text {...props}>{state.checked ? 'on' : 'off'}</Text>} />
        </Radio.Root>
      </RadioGroup>,
    );

    expect(screen.getByText('on')).toBeTruthy();
  });

  it('throws a helpful error when a radio is rendered outside a group', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Radio.Root value="apple" />)).rejects.toThrow(/RadioGroupContext is missing/);

    consoleError.mockRestore();
  });
});
