import * as React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Checkbox, CheckboxGroup } from '../index';

const ALL = ['red', 'green', 'blue'];

function TestGroup(props: React.ComponentProps<typeof CheckboxGroup>) {
  return (
    <CheckboxGroup testID="group" {...props}>
      {ALL.map((color) => (
        <Checkbox.Root key={color} testID={color} value={color} />
      ))}
    </CheckboxGroup>
  );
}

function TestParentGroup(props: React.ComponentProps<typeof CheckboxGroup>) {
  return (
    <CheckboxGroup testID="group" allValues={ALL} {...props}>
      <Checkbox.Root testID="parent" parent />
      {ALL.map((color) => (
        <Checkbox.Root key={color} testID={color} value={color} />
      ))}
    </CheckboxGroup>
  );
}

describe('CheckboxGroup', () => {
  it('accumulates values as checkboxes are ticked', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup defaultValue={['red']} onValueChange={onValueChange} />);

    expect(screen.getByTestId('red').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId('green').props.accessibilityState).toMatchObject({ checked: false });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('green'));

    expect(onValueChange).toHaveBeenCalledWith(['red', 'green'], expect.objectContaining({ reason: 'none' }));
    expect(screen.getByTestId('green').props.accessibilityState).toMatchObject({ checked: true });
  });

  it('removes a value when an already ticked checkbox is unticked', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup defaultValue={['red', 'green']} onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('red'));

    expect(onValueChange).toHaveBeenCalledWith(['green'], expect.anything());
    expect(screen.getByTestId('red').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('respects the controlled value prop', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup value={['red']} onValueChange={onValueChange} />);

    const user = userEvent.setup();
    await user.press(screen.getByTestId('green'));

    expect(onValueChange).toHaveBeenCalledWith(['red', 'green'], expect.anything());
    // Controlled: the group only changes when the owner flips the prop.
    expect(screen.getByTestId('green').props.accessibilityState).toMatchObject({ checked: false });
  });

  it('propagates disabled to its checkboxes', async () => {
    const onValueChange = jest.fn();
    await render(<TestGroup disabled onValueChange={onValueChange} />);

    expect(screen.getByTestId('red').props.accessibilityState).toMatchObject({ disabled: true });

    const user = userEvent.setup();
    await user.press(screen.getByTestId('red'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('exposes the group role', async () => {
    await render(<TestGroup />);
    expect(screen.getByTestId('group').props.role).toBe('group');
  });

  describe('parent checkbox', () => {
    it('reports mixed state when only some children are ticked', async () => {
      await render(<TestParentGroup defaultValue={['red']} />);

      expect(screen.getByTestId('parent').props.accessibilityState).toMatchObject({
        checked: 'mixed',
      });
    });

    it('reports checked when every child is ticked', async () => {
      await render(<TestParentGroup defaultValue={ALL} />);

      expect(screen.getByTestId('parent').props.accessibilityState).toMatchObject({ checked: true });
    });

    it('reports unchecked when no child is ticked', async () => {
      await render(<TestParentGroup defaultValue={[]} />);

      expect(screen.getByTestId('parent').props.accessibilityState).toMatchObject({
        checked: false,
      });
    });

    it('ticks every child when pressed from the unchecked state', async () => {
      const onValueChange = jest.fn();
      await render(<TestParentGroup defaultValue={[]} onValueChange={onValueChange} />);

      const user = userEvent.setup();
      await user.press(screen.getByTestId('parent'));

      expect(onValueChange).toHaveBeenCalledWith(ALL, expect.anything());
      for (const color of ALL) {
        expect(screen.getByTestId(color).props.accessibilityState).toMatchObject({ checked: true });
      }
      expect(screen.getByTestId('parent').props.accessibilityState).toMatchObject({ checked: true });
    });

    it('unticks every child when pressed from the checked state', async () => {
      const onValueChange = jest.fn();
      await render(<TestParentGroup defaultValue={ALL} onValueChange={onValueChange} />);

      const user = userEvent.setup();
      await user.press(screen.getByTestId('parent'));

      expect(onValueChange).toHaveBeenCalledWith([], expect.anything());
      for (const color of ALL) {
        expect(screen.getByTestId(color).props.accessibilityState).toMatchObject({ checked: false });
      }
    });

    it('ticking a child updates the parent to mixed, then to checked when all are ticked', async () => {
      await render(<TestParentGroup defaultValue={[]} />);
      const user = userEvent.setup();

      await user.press(screen.getByTestId('red'));
      expect(screen.getByTestId('parent').props.accessibilityState).toMatchObject({
        checked: 'mixed',
      });

      await user.press(screen.getByTestId('green'));
      await user.press(screen.getByTestId('blue'));
      expect(screen.getByTestId('parent').props.accessibilityState).toMatchObject({ checked: true });
    });

    it('leaves a disabled ticked child alone when the parent unticks everything', async () => {
      const onValueChange = jest.fn();
      await render(
        <CheckboxGroup testID="group" allValues={ALL} defaultValue={ALL} onValueChange={onValueChange}>
          <Checkbox.Root testID="parent" parent />
          <Checkbox.Root testID="red" value="red" disabled />
          <Checkbox.Root testID="green" value="green" />
          <Checkbox.Root testID="blue" value="blue" />
        </CheckboxGroup>,
      );

      const user = userEvent.setup();
      await user.press(screen.getByTestId('parent'));

      // The disabled-and-ticked child cannot be changed, so it survives.
      expect(onValueChange).toHaveBeenCalledWith(['red'], expect.anything());
      expect(screen.getByTestId('red').props.accessibilityState).toMatchObject({ checked: true });
      expect(screen.getByTestId('green').props.accessibilityState).toMatchObject({ checked: false });
    });

    it('cancels the parent toggle when eventDetails.cancel() is called', async () => {
      await render(
        <CheckboxGroup
          testID="group"
          allValues={ALL}
          defaultValue={[]}
          onValueChange={(value, eventDetails) => {
            eventDetails.cancel();
          }}
        >
          <Checkbox.Root testID="parent" parent />
          {ALL.map((color) => (
            <Checkbox.Root key={color} testID={color} value={color} />
          ))}
        </CheckboxGroup>,
      );

      const user = userEvent.setup();
      await user.press(screen.getByTestId('parent'));

      for (const color of ALL) {
        expect(screen.getByTestId(color).props.accessibilityState).toMatchObject({ checked: false });
      }
    });
  });
});
