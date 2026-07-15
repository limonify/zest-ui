import * as React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Toggle, ToggleGroup } from '../index';

function TestGroup(props: React.ComponentProps<typeof ToggleGroup>) {
  return (
    <ToggleGroup testID="group" {...props}>
      <Toggle testID="bold" value="bold">
        <Text>Bold</Text>
      </Toggle>
      <Toggle testID="italic" value="italic">
        <Text>Italic</Text>
      </Toggle>
    </ToggleGroup>
  );
}

describe('ToggleGroup', () => {
  it('behaves as single-select by default: pressing one unpresses the other', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup defaultValue={['bold']} onValueChange={onValueChange} />);

    expect(screen.getByTestId('bold').props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId('italic').props.accessibilityState).toMatchObject({ selected: false });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('italic'));

    expect(onValueChange).toHaveBeenCalledWith(['italic'], expect.objectContaining({ reason: 'none' }));
    expect(screen.getByTestId('bold').props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getByTestId('italic').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('accumulates values when multiple is set', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup multiple defaultValue={['bold']} onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('italic'));

    expect(onValueChange).toHaveBeenCalledWith(['bold', 'italic'], expect.anything());
    expect(screen.getByTestId('bold').props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId('italic').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('removes a value when an already pressed toggle is pressed again in multiple mode', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup multiple defaultValue={['bold', 'italic']} onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('bold'));

    expect(onValueChange).toHaveBeenCalledWith(['italic'], expect.anything());
    expect(screen.getByTestId('bold').props.accessibilityState).toMatchObject({ selected: false });
  });

  it('respects the controlled value prop', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup value={['bold']} onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('italic'));

    expect(onValueChange).toHaveBeenCalledWith(['italic'], expect.anything());
    // Controlled: the group only changes when the owner flips the prop.
    expect(screen.getByTestId('italic').props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getByTestId('bold').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('lets a Toggle cancel the group value change via eventDetails', async () => {
    const onValueChange = jest.fn();
    await render(
      <ToggleGroup testID="group" onValueChange={onValueChange}>
        <Toggle
          testID="bold"
          value="bold"
          onPressedChange={(pressed, eventDetails) => {
            eventDetails.cancel();
          }}
        />
      </ToggleGroup>,
    );

    const user = userEvent.setup();
    await user.press(screen.getByTestId('bold'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('bold').props.accessibilityState).toMatchObject({ selected: false });
  });

  it('propagates disabled to its toggles', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup disabled onValueChange={onValueChange} />);

    expect(screen.getByTestId('bold').props.accessibilityState).toMatchObject({ disabled: true });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('bold'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('exposes the group role and orientation', async () => {
    await render(<TestGroup orientation="vertical" />);

    const group = screen.getByTestId('group');
    expect(group.props.role).toBe('group');
    expect(group.props['aria-orientation']).toBe('vertical');
  });
});
